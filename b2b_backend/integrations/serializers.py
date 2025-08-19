from rest_framework import serializers
from .models import SnmpResult


class SnmpResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = SnmpResult
        fields = ["id", "created_at", "host", "oid", "value"]

