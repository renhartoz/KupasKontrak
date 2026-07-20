import datetime
import requests
from django.conf import settings


class MCPValidationError(Exception):
    pass


class MCPClient:
    def __init__(self):
        self.base_url = getattr(
            settings, "PASAL_ID_MCP_ENDPOINT", "https://pasal.id/api/v1"
        )
        self.api_key = getattr(settings, "PASAL_ID_MCP_API_KEY", "")

    def validate_clause(self, clause) -> dict:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        query_text = getattr(clause, "mcp_query_hint", None) or clause.clause_text[:100]

        base = self.base_url.rstrip("/")
        if base.endswith("/laws") or base.endswith("/mcp") or base.endswith("/search"):
            search_url = base.rsplit("/", 1)[0] + "/search"
        else:
            search_url = f"{base}/search"

        try:
            resp = requests.get(
                search_url,
                params={"q": query_text, "limit": 1},
                headers=headers,
                timeout=15,
            )
            if resp.status_code != 200:
                raise MCPValidationError(
                    f"Remote Pasal.ID API returned status code {resp.status_code}"
                )
            data = resp.json()
            results = data.get("results", [])
            if not results:
                raise MCPValidationError(
                    "Remote Pasal.ID API found no exact legal reference for clause."
                )
            res = results[0]
            work = res.get("work", {})
            metadata = res.get("metadata", {})
            law_title = f"{work.get('type', '')} {work.get('number', '')}/{work.get('year', '')} - {work.get('title', '')}".strip()
            article_num = f"{metadata.get('node_type', 'pasal').capitalize()} {metadata.get('node_number', '')}".strip()
            source_url = f"https://pasal.id{work.get('frbr_uri')}" if work.get("frbr_uri") else ""
            return {
                "law": law_title,
                "article": article_num,
                "source_url": source_url,
                "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
        except requests.RequestException as exc:
            raise MCPValidationError(f"Failed to connect to remote Pasal.ID API: {exc}")
