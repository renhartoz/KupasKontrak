import asyncio
from django.conf import settings
from django.core.management.base import BaseCommand
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


class Command(BaseCommand):
    help = "Hubungkan ke MCP pasal.id dan cetak daftar tool yang tersedia beserta skema argumennya."

    def handle(self, *args, **options):
        asyncio.run(self._discover())

    async def _discover(self):
        url = getattr(settings, "PASAL_ID_MCP_ENDPOINT", "https://mcp.pasal.id/mcp")
        api_key = getattr(settings, "PASAL_ID_MCP_API_KEY", "")
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}

        async with streamablehttp_client(url, headers=headers) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                response = await session.list_tools()
                for tool in response.tools:
                    self.stdout.write(self.style.SUCCESS(f"\nTool: {tool.name}"))
                    self.stdout.write(f"  Deskripsi : {tool.description}")
                    self.stdout.write(f"  Argumen   : {tool.inputSchema}")
