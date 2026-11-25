from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import get_admin_profile

from .models import Table
from .serializers import TableSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def admin_tables(request):
	"""Lista o crea mesas (solo administrators de restaurantes)."""
	denied = None
	if get_admin_profile(request.user) is None:
		denied = Response(
			{"detail": "Solo el administrador de un restaurante puede gestionar las mesas."},
			status=status.HTTP_403_FORBIDDEN,
		)
	if denied:
		return denied

	if request.method == "GET":
		return Response(TableSerializer(Table.objects.all(), many=True).data)

	serializer = TableSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_table_detail(request, pk):
	"""Edita o elimina una mesa (solo administrators de restaurantes)."""
	denied = None
	if get_admin_profile(request.user) is None:
		denied = Response(
			{"detail": "Solo el administrador de un restaurante puede gestionar las mesas."},
			status=status.HTTP_403_FORBIDDEN,
		)
	if denied:
		return denied

	table = get_object_or_404(Table, pk=pk)
	if request.method == "DELETE":
		table.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

	serializer = TableSerializer(table, data=request.data, partial=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
