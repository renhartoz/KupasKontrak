from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/accounts/", include("accounts.urls")),
    path("v1/documents/", include("documents.urls")),
    path("v1/audits/", include("audits.urls")),
    path("v1/chat/", include("chat.urls")),
    path("v1/insights/", include("insights.urls")),
    path("v1/billing/", include("billing.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
