from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tables.models import Table
from users.permissions import get_staff_profile

from .models import TableReservation
from .serializers import TableReservationSerializer


def my_reservations(user):
	return TableReservation.objects.filter(user=user).order_by(
		"-fecha", "-hora", "-created_at"
	)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def table_reservations(request):
	"""Ver o crear mis peticiones de mesa."""
	if request.method == "GET":
		serializer = TableReservationSerializer(
			my_reservations(request.user), many=True
		)
		return Response(serializer.data)

	serializer = TableReservationSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save(user=request.user, estado=TableReservation.PENDIENTE)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def table_reservation_detail(request, pk):
	"""Ver una petición de mesa de mi lista."""
	reservation = get_object_or_404(
		TableReservation, pk=pk, user=request.user
	)
	serializer = TableReservationSerializer(reservation)
	return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cancel_table_reservation(request, pk):
	"""Cancelar una petición de mesa pendiente."""
	reservation = get_object_or_404(
		TableReservation, pk=pk, user=request.user
	)
	if reservation.estado != TableReservation.PENDIENTE:
		return Response(
			{"detail": "Solo puedes cancelar una reserva pendiente."},
			status=status.HTTP_400_BAD_REQUEST,
		)
	reservation.estado = TableReservation.CANCELADA
	reservation.save(update_fields=["estado", "updated_at"])
	return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_table_reservation(request, pk):
	"""Aceptar una petición de mesa (solo personal del restaurante)."""
	staff = get_staff_profile(request.user)
	if not staff:
		return Response(
			{"detail": "Solo el personal de un restaurante puede aceptar reservas."},
			status=status.HTTP_403_FORBIDDEN,
		)

	reservation = get_object_or_404(TableReservation, pk=pk)
	if reservation.restaurante_id != staff.restaurante_id:
		return Response(status=status.HTTP_404_NOT_FOUND)

	if reservation.estado != TableReservation.PENDIENTE:
		return Response(
			{"detail": "La reserva ya no está pendiente."},
			status=status.HTTP_400_BAD_REQUEST,
		)

	reservation.estado = TableReservation.ACCEPTADA
	reservation.save(update_fields=["estado", "updated_at"])
	serializer = TableReservationSerializer(reservation)
	return Response(serializer.data)
