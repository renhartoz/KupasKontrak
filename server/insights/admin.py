from django.contrib import admin
from .models import (
    ContractVisualization,
    ActionRecommendation,
    GeneratedContractDraft,
)

admin.site.register(ContractVisualization)
admin.site.register(ActionRecommendation)
admin.site.register(GeneratedContractDraft)
