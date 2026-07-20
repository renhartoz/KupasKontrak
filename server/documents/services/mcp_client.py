import asyncio
import datetime
import json
from django.conf import settings
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


class MCPValidationError(Exception):
    pass


class MCPClient:
    def __init__(self):
        self.url = getattr(settings, "PASAL_ID_MCP_ENDPOINT", "https://mcp.pasal.id/mcp")
        self.api_key = getattr(settings, "PASAL_ID_MCP_API_KEY", "")
        self.tool_name = getattr(settings, "PASAL_ID_MCP_TOOL_NAME", "")

    def validate_clause(self, clause) -> dict:
        return asyncio.run(self._validate_clause_async(clause))

    async def _validate_clause_async(self, clause) -> dict:
        if not self.tool_name:
            raise MCPValidationError(
                "PASAL_ID_MCP_TOOL_NAME belum diisi. Jalankan "
                "`python manage.py discover_pasal_mcp_tools` untuk konfirmasi nama tool."
            )

        query_text = getattr(clause, "mcp_query_hint", None) or clause.clause_text[:200]
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

        try:
            async with streamablehttp_client(self.url, headers=headers) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(
                        self.tool_name,
                        arguments={"q": query_text, "limit": 1},
                    )
        except MCPValidationError:
            raise
        except Exception as exc:
            raise MCPValidationError(f"Gagal terhubung/memanggil MCP pasal.id: {exc}") from exc

        return self._parse_result(result)

    def _parse_result(self, result) -> dict:
        if getattr(result, "isError", False):
            raise MCPValidationError(f"MCP pasal.id mengembalikan error: {result.content}")

        payload = self._extract_json_payload(result)
        if payload is None:
            raise MCPValidationError("Respons MCP pasal.id tidak bisa di-parse sebagai JSON.")

        results = payload.get("results", [])
        if not results:
            did_you_mean = payload.get("did_you_mean") or []
            hint = f" Saran terdekat: {did_you_mean[0]['work']['title']}." if did_you_mean else ""
            raise MCPValidationError(f"MCP pasal.id tidak menemukan rujukan pasal yang cocok.{hint}")

        return self._to_legal_reference(results[0])

    def _extract_json_payload(self, result) -> dict | None:
        structured = getattr(result, "structuredContent", None)
        if structured:
            return structured

        for block in getattr(result, "content", []) or []:
            if getattr(block, "type", None) == "text":
                try:
                    return json.loads(block.text)
                except (ValueError, TypeError):
                    continue
        return None

    def _to_legal_reference(self, entry: dict) -> dict:
        work = entry.get("work") or {}
        metadata = entry.get("metadata") or {}

        law_type = work.get("type", "")
        law_number = work.get("number", "")
        law_year = work.get("year", "")
        law_title = work.get("title", "")
        if not (law_type and law_number and law_title):
            raise MCPValidationError("Respons MCP pasal.id tidak memuat metadata peraturan yang lengkap.")
        law = f"{law_type} No. {law_number} Tahun {law_year} tentang {law_title}"

        node_type = str(metadata.get("node_type", "pasal")).capitalize()
        node_number = metadata.get("node_number", "")
        article = f"{node_type} {node_number}".strip()

        frbr_uri = work.get("frbr_uri")
        source_url = f"https://pasal.id{frbr_uri}" if frbr_uri else ""

        return {
            "law": law,
            "article": article,
            "source_url": source_url,
            "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
