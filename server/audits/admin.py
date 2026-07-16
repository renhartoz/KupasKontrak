from django.contrib import admin
from .models import AuditEvent, ClauseFinding

admin.site.register(AuditEvent)
admin.site.register(ClauseFinding)
