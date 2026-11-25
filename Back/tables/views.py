from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from users.permissions import get_admin_profile, get_waiter_profile

from .models import Table
from .serializers import TableSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def staff_tables(request):
	"""Mesas del restaurante para el personal de sala (solo lectura)."""
	profile = get_waiter_profile(request.user)
	if profile is None:
		return Response(
			{"detail": "Solo el personal de sala puede consultar las mesas."},
			status=status.HTTP_403_FORBIDDEN,
		)
	tables = Table.objects.filter(restaurante=profile.restaurante).order_by(
		"nombre", "id"
	)
	return Response(TableSerializer(tables, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_tables(request):
	"""Mesas disponibles de un restaurante para que el cliente reserve."""
	restaurante = request.query_params.get("restaurante")
	if not restaurante:
		return Response(
			{"detail": "Indica el restaurante para consultar sus mesas."},
			status=status.HTTP_400_BAD_REQUEST,
		)
	tables = Table.objects.filter(
		restaurante_id=restaurante, esta_disponible=True
	).order_by("nombre", "id")
	return Response(TableSerializer(tables, many=True).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def admin_tables(request):
	"""Lista o crea mesas (solo administrators de restaurantes)."""
	profile = get_admin_profile(request.user)
	if profile is None:
		return Response(
			{"detail": "Solo el administrador de un restaurante puede gestionar las mesas."},
			status=status.HTTP_403_FORBIDDEN,
		)

	if request.method == "GET":
		tables = Table.objects.filter(restaurante=profile.restaurante).order_by("nombre", "id")
		return Response(TableSerializer(tables, many=True).data)

	serializer = TableSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save(restaurante=profile.restaurante)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_table_detail(request, pk):
	"""Edita o elimina una mesa (solo administradores de restaurantes)."""
	profile = get_admin_profile(request.user)
	if profile is None:
		return Response(
			{"detail": "Solo el administrador de un restaurante puede gestionar las mesas."},
			status=status.HTTP_403_FORBIDDEN,
		)

	table = get_object_or_404(Table.objects.filter(restaurante=profile.restaurante), pk=pk)
	if request.method == "DELETE":
		table.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

	serializer = TableSerializer(table, data=request.data, partial=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
