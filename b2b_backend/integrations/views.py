from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import SnmpResult
from .serializers import SnmpResultSerializer


@api_view(['GET'])
def health(request):
    return Response({"status": "ok"})


@api_view(['POST'])
def snmpv3_collect(request):
    # Lazy import pysnmp to avoid import-time errors during migrations
    try:
        from pysnmp.hlapi import (
            SnmpEngine, UsmUserData, UdpTransportTarget, ContextData,
            ObjectType, ObjectIdentity, getCmd, nextCmd,
            usmHMACSHAAuthProtocol, usmAesCfb128Protocol
        )
    except Exception as exc:
        return Response({"error": f"pysnmp import error: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    payload = request.data or {}
    host = payload.get('host')
    port = int(payload.get('port') or 161)
    security_user = payload.get('username')
    auth_key = payload.get('auth_key')
    priv_key = payload.get('priv_key')
    auth_proto = usmHMACSHAAuthProtocol
    priv_proto = usmAesCfb128Protocol

    oids = payload.get('oids') or []  # liste d’OIDs à interroger, sinon on fait un walk sur sysDescr
    if not host or not security_user:
        return Response({"error": "host and username are required"}, status=status.HTTP_400_BAD_REQUEST)

    engine = SnmpEngine()
    user = UsmUserData(security_user, authKey=auth_key, privKey=priv_key,
                       authProtocol=auth_proto, privProtocol=priv_proto)
    target = UdpTransportTarget((host, port), timeout=2.0, retries=1)
    context = ContextData()

    results = []
    errors = []

    try:
        if oids:
            # GET pour chaque OID
            for oid in oids:
                errorIndication, errorStatus, errorIndex, varBinds = next(
                    getCmd(engine, user, target, context, ObjectType(ObjectIdentity(oid)))
                )
                if errorIndication:
                    errors.append({"oid": oid, "error": str(errorIndication)})
                    continue
                if errorStatus:
                    errors.append({"oid": oid, "error": f"{errorStatus.prettyPrint()} at {errorIndex}"})
                    continue
                for varBind in varBinds:
                    oid_str, val = [x.prettyPrint() for x in varBind]
                    results.append({"oid": oid_str, "value": val})
        else:
            # Walk de base sur sysDescr comme test
            for (errorIndication, errorStatus, errorIndex, varBinds) in nextCmd(
                engine, user, target, context, ObjectType(ObjectIdentity('1.3.6.1.2.1.1')),
                lexicographicMode=False
            ):
                if errorIndication:
                    errors.append({"error": str(errorIndication)})
                    break
                if errorStatus:
                    errors.append({"error": f"{errorStatus.prettyPrint()} at {errorIndex}"})
                    break
                for varBind in varBinds:
                    oid_str, val = [x.prettyPrint() for x in varBind]
                    results.append({"oid": oid_str, "value": val})
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Persist results
    created = []
    for r in results:
        obj = SnmpResult.objects.create(host=host, oid=r["oid"], value=r["value"]) 
        created.append(obj)

    return Response({
        "host": host,
        "count": len(results),
        "results": results,
        "errors": errors,
        "stored": SnmpResultSerializer(created, many=True).data,
    })