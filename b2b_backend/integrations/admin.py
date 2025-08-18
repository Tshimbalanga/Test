from django.contrib import admin
from .models import SnmpResult


@admin.register(SnmpResult)
class SnmpResultAdmin(admin.ModelAdmin):
    list_display = ("created_at", "host", "oid", "value")
    search_fields = ("host", "oid", "value")

# Register your models here.
