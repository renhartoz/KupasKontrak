import asyncio
import json

from django.core.management.base import BaseCommand

from documents.services.mcp_client import MCPClient


class Command(BaseCommand):
    help = "Debug MCPClient v2 workflow: resolve → get_law_context (atau search → get_law_context)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--test-query", type=str, default=None,
            help="Jalankan full MCPClient v2 pipeline dan tampilkan setiap langkah.",
        )
        parser.add_argument(
            "--raw", action="store_true", default=False,
            help="Bersama --test-query: cetak raw JSON response di setiap langkah.",
        )

    def handle(self, *args, **options):
        asyncio.run(self._run(options))

    async def _run(self, options):
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client

        client = MCPClient()
        headers = {"Authorization": f"Bearer {client.api_key}"} if client.api_key else {}

        async with streamablehttp_client(client.url, headers=headers) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()

                if options["test_query"]:
                    query = options["test_query"]
                    self.stdout.write(self.style.SUCCESS(f'\n▶ query: "{query}"'))

                    self.stdout.write("\n── Step 1: resolve_law ──")
                    resolve_law_id = await client._resolve_law_id(session, query)
                    if resolve_law_id:
                        self.stdout.write(self.style.SUCCESS(f"  ✓ law_id = {resolve_law_id}"))
                    else:
                        self.stdout.write("  ✗ no match — Path B: search_legal")

                    best = {}
                    if not resolve_law_id:
                        self.stdout.write("\n── Step 2B: search_legal ──")
                        try:
                            results = await client._search_legal(session, query)
                        except Exception as exc:
                            self.stdout.write(self.style.ERROR(f"  ERROR: {exc}"))
                            return
                        self.stdout.write(f"  {len(results)} candidates:")
                        for e in results:
                            s = client._score_candidate(e)
                            self.stdout.write(
                                f"    score={s:.4f}  [{e.get('status')}] {e.get('citation')} — {e.get('law_title')}"
                            )
                            if options["raw"]:
                                self.stdout.write(f"    {json.dumps(e, ensure_ascii=False)}")
                        try:
                            best = client._pick_best(results, query)
                        except Exception as exc:
                            self.stdout.write(self.style.ERROR(f"  ERROR: {exc}"))
                            return
                        law_id = best.get("law_id")
                        self.stdout.write(self.style.SUCCESS(f"  → picked: {best.get('citation')} (law_id={law_id})"))

                    self.stdout.write("\n── Step 3: get_law_context ──")
                    law_ref = query if resolve_law_id else best.get("citation", "")
                    self.stdout.write(f"  law arg: {law_ref!r}")
                    ctx_payload = None
                    if law_ref:
                        try:
                            raw_ctx = await session.call_tool(
                                client.context_tool, arguments={"law": law_ref}
                            )
                            _p = client._extract_json_payload(raw_ctx)
                            if _p and "error_code" in _p:
                                self.stdout.write(self.style.WARNING(
                                    f"  ✗ server error_code={_p['error_code']!r}: {_p.get('message', '')}"
                                ))
                                if options["raw"]:
                                    self.stdout.write(f"  candidates: {json.dumps(_p.get('candidates'), ensure_ascii=False)}")
                            elif _p:
                                ctx_payload = _p
                                self.stdout.write(self.style.SUCCESS("  ✓ context received"))
                                if options["raw"]:
                                    self.stdout.write(json.dumps(ctx_payload, indent=2, ensure_ascii=False))
                            else:
                                self.stdout.write("  ✗ payload kosong")
                        except Exception as exc:
                            self.stdout.write(self.style.ERROR(f"  EXCEPTION: {exc}"))

                    read_payload = None
                    if ctx_payload:
                        self.stdout.write("\n── Step 3b: read_law (selector=menimbang) ──")
                        try:
                            raw_read = await session.call_tool(
                                client.read_tool, arguments={"law": law_ref, "selector": "menimbang"}
                            )
                            _p = client._extract_json_payload(raw_read)
                            if _p and "error_code" in _p:
                                self.stdout.write(self.style.WARNING(
                                    f"  ✗ server error_code={_p['error_code']!r}: {_p.get('message', '')}"
                                ))
                            elif _p:
                                read_payload = _p
                                self.stdout.write(self.style.SUCCESS("  ✓ read_law received"))
                                if options["raw"]:
                                    self.stdout.write(json.dumps(read_payload, indent=2, ensure_ascii=False))
                            else:
                                self.stdout.write("  ✗ payload kosong")
                        except Exception as exc:
                            self.stdout.write(self.style.ERROR(f"  EXCEPTION: {exc}"))

                    self.stdout.write(self.style.SUCCESS("\n── Pilihan akhir ──"))
                    if read_payload and ctx_payload:
                        ref = client._format_from_read(read_payload, ctx_payload)
                        self.stdout.write("  source: read_law + context (Path A/B enriched)")
                    elif ctx_payload:
                        ref = client._format_from_context(ctx_payload)
                        self.stdout.write("  source: context only")
                    elif best:
                        ref = client._to_legal_reference(best)
                        self.stdout.write("  source: _to_legal_reference (search fallback)")
                    else:
                        ref = None

                    if ref:
                        self.stdout.write(self.style.SUCCESS(f"  {ref['law']}"))
                        if ref.get("article"):
                            self.stdout.write(f"  {ref['article']}")
                        self.stdout.write(f"  {ref['source_url']}")
                    else:
                        self.stdout.write(self.style.WARNING("  tidak ada ref yang valid"))
                    return

                response = await session.list_tools()
                for tool in response.tools:
                    self.stdout.write(self.style.SUCCESS(f"\nTool: {tool.name}"))
                    self.stdout.write(f"  Deskripsi : {tool.description}")
                    self.stdout.write(f"  Argumen   : {tool.inputSchema}")