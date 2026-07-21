import asyncio
import datetime
import json
import re

from django.conf import settings
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

_ACTIVE_STATUSES = {"berlaku", "diubah"}
_NATIONAL_LAW_TYPES = {
    "UU", "PERPPU", "PP", "PERPRES", "KEPPRES", "PENPRES", "INPRES",
    "PERMEN", "PERMENKUMHAM", "PERMENKUM", "KEPMEN", "PERBAN",
}
_CITATION_RE = re.compile(r"^([A-Z_]+)\s+(\d+)/(\d{4})$")


def _parse_citation(citation: str) -> tuple[str, str, str]:
    match = _CITATION_RE.match((citation or "").strip().upper())
    if match:
        return match.group(1), match.group(2), match.group(3)
    return "", "", ""


class MCPValidationError(Exception):
    pass


class MCPClient:
    def __init__(self):
        self.url = getattr(settings, "PASAL_ID_MCP_ENDPOINT", "https://mcp.pasal.id/mcp")
        self.api_key = getattr(settings, "PASAL_ID_MCP_API_KEY", "")
        self.search_tool = "search_legal"
        self.resolve_tool = "resolve_law"
        self.context_tool = "get_law_context"
        self.read_tool = "read_law"

    def validate_clause(self, clause) -> dict:
        return asyncio.run(self._validate_clause_async(clause))

    async def _validate_clause_async(self, clause) -> dict:
        query_text = getattr(clause, "mcp_query_hint", None) or clause.clause_text[:200]
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

        try:
            async with streamablehttp_client(self.url, headers=headers) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()

                    law_id = await self._resolve_law_id(session, query_text)

                    if law_id:
                        context = await self._get_law_context(session, query_text)
                        if context:
                            read_result = await self._read_law(session, query_text)
                            if read_result:
                                return self._format_from_read(read_result, context)
                            ref = self._format_from_context(context)
                            if ref:
                                return ref

                    results = await self._search_legal(session, query_text)
                    best = self._pick_best(results, query_text)

                    for law_ref in [self._normalize_reference(query_text), best.get("citation", "")]:
                        if not law_ref:
                            continue
                        context = await self._get_law_context(session, law_ref)
                        if context:
                            read_result = await self._read_law(session, law_ref)
                            if read_result:
                                return self._format_from_read(read_result, context)
                            ref = self._format_from_context(context)
                            if ref:
                                return ref
                        break

                    return self._to_legal_reference(best)

        except MCPValidationError:
            raise
        except Exception as exc:
            raise MCPValidationError(f"Gagal terhubung/memanggil MCP pasal.id: {exc}") from exc

    def _normalize_reference(self, query_text: str) -> str:
        normalized = query_text.strip().upper()
        if _CITATION_RE.match(normalized):
            return normalized
        return ""

    async def _resolve_law_id(self, session, query_text: str) -> int | None:
        reference = self._normalize_reference(query_text) or query_text
        try:
            result = await session.call_tool(self.resolve_tool, arguments={"reference": reference})
        except Exception:
            return None
        if getattr(result, "isError", False):
            return None
        payload = self._extract_json_payload(result)
        if not payload:
            return None
        return payload.get("law_id")

    async def _search_legal(self, session, query_text: str) -> list:
        result = await session.call_tool(
            self.search_tool,
            arguments={"query": query_text, "limit": 5},
        )
        if getattr(result, "isError", False):
            raise MCPValidationError(f"MCP pasal.id mengembalikan error: {getattr(result, 'content', '')}")
        payload = self._extract_json_payload(result)
        if payload is None:
            raise MCPValidationError("Respons MCP pasal.id tidak bisa di-parse sebagai JSON.")
        results = payload.get("results", [])
        if not results:
            raise MCPValidationError(
                f'MCP pasal.id tidak menemukan rujukan pasal yang cocok untuk query: "{query_text}".'
            )
        return results

    async def _get_law_context(self, session, law_ref: str) -> dict | None:
        try:
            result = await session.call_tool(self.context_tool, arguments={"law": law_ref})
        except Exception:
            return None
        if getattr(result, "isError", False):
            return None
        payload = self._extract_json_payload(result)
        if payload is None or "error_code" in payload:
            return None
        return payload

    async def _read_law(self, session, law_ref: str, selector: str = "menimbang") -> dict | None:
        try:
            result = await session.call_tool(
                self.read_tool, arguments={"law": law_ref, "selector": selector}
            )
        except Exception:
            return None
        if getattr(result, "isError", False):
            return None
        payload = self._extract_json_payload(result)
        if payload is None or "error_code" in payload:
            return None
        return payload

    def _pick_best(self, results: list, query_text: str) -> dict:
        active = [e for e in results if (e.get("status") or "").lower() in _ACTIVE_STATUSES]
        candidates = active if active else results
        best = max(candidates, key=self._score_candidate)
        if self._score_candidate(best) <= 0:
            raise MCPValidationError(
                "Semua kandidat hasil pencarian MCP pasal.id berstatus tidak aktif/dicabut."
            )
        return best

    def _score_candidate(self, entry: dict) -> float:
        status = (entry.get("status") or "").lower()
        if status not in _ACTIVE_STATUSES:
            return 0.0
        law_type, _, _ = _parse_citation(entry.get("citation", ""))
        national_bonus = 10.0 if law_type in _NATIONAL_LAW_TYPES else 0.0
        return 1.0 + national_bonus + float(entry.get("relevance_score", 0.0) or 0.0)

    def _format_from_context(self, context: dict) -> dict | None:
        law_obj = context.get("law") or {}
        citation = law_obj.get("citation") or ""
        law_type, law_number, law_year = _parse_citation(citation)
        law_title = (law_obj.get("law_title") or "").strip()
        source_url = str(law_obj.get("law_url") or "")

        if not (law_type and law_number and law_title):
            return None

        return {
            "law": f"{law_type} No. {law_number} Tahun {law_year} tentang {law_title}",
            "article": "",
            "source_url": source_url,
            "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    def _format_from_read(self, read_result: dict, context: dict) -> dict | None:
        law_obj = read_result.get("law") or context.get("law") or {}
        citation = law_obj.get("citation") or ""
        law_type, law_number, law_year = _parse_citation(citation)
        law_title = (law_obj.get("law_title") or "").strip()
        source_url = str(law_obj.get("law_url") or "")
        selector = str(read_result.get("selector_parsed") or "").strip()

        if not (law_type and law_number and law_title):
            return None

        return {
            "law": f"{law_type} No. {law_number} Tahun {law_year} tentang {law_title}",
            "article": selector,
            "source_url": source_url,
            "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    def _to_legal_reference(self, entry: dict) -> dict:
        law_type, law_number, law_year = _parse_citation(entry.get("citation", ""))
        law_title = (entry.get("law_title") or "").strip()
        if not (law_type and law_number and law_title):
            raise MCPValidationError("Respons MCP pasal.id tidak memuat metadata peraturan yang lengkap.")
        article = str(entry.get("pasal_number") or entry.get("article") or "").strip()
        source_url = str(entry.get("url") or "")
        return {
            "law": f"{law_type} No. {law_number} Tahun {law_year} tentang {law_title}",
            "article": article,
            "source_url": source_url,
            "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

    def _extract_json_payload(self, result) -> dict | None:
        structured = getattr(result, "structuredContent", None)
        if isinstance(structured, dict):
            return structured
        for block in getattr(result, "content", []) or []:
            if getattr(block, "type", None) == "text":
                try:
                    return json.loads(getattr(block, "text", ""))
                except (ValueError, TypeError):
                    continue
        return None