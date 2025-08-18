from django.db import models


class SnmpResult(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    host = models.CharField(max_length=255)
    oid = models.CharField(max_length=255)
    value = models.TextField()

    class Meta:
        indexes = [
            models.Index(fields=["host", "created_at"]),
        ]

    def __str__(self):
        return f"{self.host} {self.oid}={self.value}"

# Create your models here.
