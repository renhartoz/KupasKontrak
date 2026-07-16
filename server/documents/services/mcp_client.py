import datetime
import requests
from django.conf import settings


class MCPValidationError(Exception):
    pass


class MCPClient:
    def __init__(self):
        self.base_url = getattr(
            settings, "PASAL_ID_MCP_ENDPOINT", "https://pasal.id/api/v1/mcp"
        )
        self.api_key = getattr(settings, "PASAL_ID_MCP_API_KEY", "")

    def validate_clause(self, clause) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "query": clause.mcp_query_hint,
            "category": clause.category,
            "clause_text": clause.clause_text,
        }

        try:
            resp = requests.post(self.base_url, headers=headers, json=payload, timeout=15)
            if resp.status_code != 200:
                raise MCPValidationError(
                    f"Remote MCP server returned status code {resp.status_code}"
                )
            data = resp.json()
            if not data.get("found") or not data.get("legal_reference"):
                raise MCPValidationError(
                    "Remote MCP server found no exact legal reference for clause."
                )
            ref = data["legal_reference"]
            return {
                "law": str(ref.get("law", "")),
                "article": str(ref.get("article", "")),
                "source_url": str(ref.get("source_url", "")),
                "retrieved_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
        except requests.RequestException as exc:
            raise MCPValidationError(f"Failed to connect to remote MCP server: {exc}")
