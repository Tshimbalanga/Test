from django.urls import path
from .views import health, snmpv3_collect

urlpatterns = [
    path('health', health, name='health'),
    path('integrations/snmpv3', snmpv3_collect, name='snmpv3_collect'),
]

