from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import get_waiter_profile

from .models import TableReservation
from .serializers import TableReservationSerializer


def my_reservations(user):
	return TableReservation.objects.filter(user=user).order_by(
		"-fecha", "-hora", "-created_at"
	)


def visible_reservations(user):
	"""Reservas que puede ver el usuario: las suyas o todas las de su tienda."""
	waiter = get_waiter_profile(user)
	if waiter:
		return TableReservation.objects.filter(
			restaurante=waiter.restaurante
		).order_by("-fecha", "-hora", "-created_at")
	return my_reservations(user)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def table_reservations(request):
	"""Ver o crear peticiones de mesa.

	El cliente pide su reserva. El mesero ve todas las de su restaurante. El
	administrador solo puede crear; la gestión diaria corresponde al mesero.
	"""
	if request.method == "GET":
		serializer = TableReservationSerializer(
			visible_reservations(request.user), many=True
		)
		return Response(serializer.data)

	if get_waiter_profile(request.user):
		return Response(
			{"detail": "El personal de sala administra las reservas, no las crea."},
			status=status.HTTP_403_FORBIDDEN,
		)

	serializer = TableReservationSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save(user=request.user, estado=TableReservation.PENDIENTE)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def table_reservation_detail(request, pk):
	"""Ver una reserva propia o una de la tienda del mesero."""
	reservation = get_object_or_404(visible_reservations(request.user), pk=pk)
	return Response(TableReservationSerializer(reservation).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cancel_table_reservation(request, pk):
	"""Cancelar una reserva: el cliente la suya o el mesero las de su tienda."""
	waiter = get_waiter_profile(request.user)
	if waiter:
		reservation = get_object_or_404(
			TableReservation,
			pk=pk,
			restaurante=waiter.restaurante,
		)
		if reservation.estado == TableReservation.CANCELADA:
			return Response(
				{"detail": "La reserva ya está cancelada."},
				status=status.HTTP_400_BAD_REQUEST,
			)
	else:
		reservation = get_object_or_404(
			TableReservation, pk=pk, user=request.user
		)
		if reservation.estado != TableReservation.PENDIENTE:
			return Response(
				{"detail": "Solo puedes cancelar una reserva pendiente."},
				status=status.HTTP_400_BAD_REQUEST,
			)

	was_accepted = reservation.estado == TableReservation.ACCEPTADA
	reservation.estado = TableReservation.CANCELADA
	reservation.save(update_fields=["estado", "updated_at"])
	if was_accepted:
		reservation.mesa.esta_disponible = True
		reservation.mesa.save(update_fields=["esta_disponible"])
	return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_table_reservation(request, pk):
	"""Aceptar una petición de mesa (solo el mesero del restaurante)."""
	waiter = get_waiter_profile(request.user)
	if not waiter:
		return Response(
			{"detail": "Solo el personal de sala puede aceptar reservas."},
			status=status.HTTP_403_FORBIDDEN,
		)

	reservation = get_object_or_404(
		TableReservation,
		pk=pk,
		restaurante=waiter.restaurante,
	)
	if reservation.estado != TableReservation.PENDIENTE:
		return Response(
			{"detail": "La reserva ya no está pendiente."},
			status=status.HTTP_400_BAD_REQUEST,
		)

	reservation.estado = TableReservation.ACCEPTADA
	reservation.save(update_fields=["estado", "updated_at"])
	reservation.mesa.esta_disponible = False
	reservation.mesa.save(update_fields=["esta_disponible"])
	serializer = TableReservationSerializer(reservation)
	return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_table_reservation(request, pk):
	"""Cerrar una reserva aceptada y liberar la mesa (solo el mesero)."""
	waiter = get_waiter_profile(request.user)
	if not waiter:
		return Response(
			{"detail": "Solo el personal de sala puede completar reservas."},
			status=status.HTTP_403_FORBIDDEN,
		)

	reservation = get_object_or_404(
		TableReservation,
		pk=pk,
		restaurante=waiter.restaurante,
	)
	if reservation.estado != TableReservation.ACCEPTADA:
		return Response(
			{"detail": "Solo puedes completar una reserva aceptada."},
			status=status.HTTP_400_BAD_REQUEST,
		)

	reservation.estado = TableReservation.COMPLETADA
	reservation.save(update_fields=["estado", "updated_at"])
	reservation.mesa.esta_disponible = True
	reservation.mesa.save(update_fields=["esta_disponible"])
	return Response(TableReservationSerializer(reservation).data)
