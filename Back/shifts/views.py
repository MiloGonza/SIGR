from datetime import date

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import Profile

from .models import Shift
from .serializers import ShiftSerializer


STAFF_ROLES = (Profile.MESERO, Profile.ADMINISTRADOR)


def get_staff_profile(user):
	profile = getattr(user, "profile", None)
	if profile and profile.rol in STAFF_ROLES and profile.restaurante_id:
		return profile
	return None


def parse_date(value):
	if not value:
		return None
	try:
		return date.fromisoformat(str(value))
	except (TypeError, ValueError):
		return None


def forbidden(message):
	return Response({"detail": message}, status=status.HTTP_403_FORBIDDEN)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def shifts(request):
	"""Lista o programa turnos del restaurante.

	El administrador ve y gestiona todo su restaurante; el mesero solo
	puede consultar sus propios turnos.
	"""

	profile = get_staff_profile(request.user)
	if profile is None:
		return forbidden(
			"Solo el personal de un restaurante puede consultar turnos."
		)

	if request.method == "GET":
		queryset = (
			Shift.objects.filter(restaurante_id=profile.restaurante_id)
			.select_related("empleado", "empleado__profile")
			.order_by("fecha", "hora_inicio")
		)

		if profile.rol == Profile.MESERO:
			queryset = queryset.filter(empleado_id=request.user.pk)
		else:
			empleado = request.query_params.get("empleado")
			if empleado:
				try:
					empleado_id = int(empleado)
				except (TypeError, ValueError):
					return Response(
						{"empleado": ["Identificador de empleado inválido."]},
						status=status.HTTP_400_BAD_REQUEST,
					)
				queryset = queryset.filter(empleado_id=empleado_id)

		desde = parse_date(request.query_params.get("desde"))
		hasta = parse_date(request.query_params.get("hasta"))
		if desde:
			queryset = queryset.filter(fecha__gte=desde)
		if hasta:
			queryset = queryset.filter(fecha__lte=hasta)

		return Response(ShiftSerializer(queryset, many=True).data)

	if profile.rol != Profile.ADMINISTRADOR:
		return forbidden("Solo el administrador puede programar turnos.")

	serializer = ShiftSerializer(
		data=request.data,
		context={"request": request, "restaurante": profile.restaurante},
	)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	serializer.save()
	creados = getattr(serializer, "created_shifts", [])
	return Response(
		{
			"turnos": ShiftSerializer(creados, many=True).data,
			"omitidos": getattr(serializer, "omitidos", []),
		},
		status=status.HTTP_201_CREATED,
	)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def shift_detail(request, pk):
	"""Consulta, reprograma o elimina un turno concreto."""

	profile = get_staff_profile(request.user)
	if profile is None:
		return forbidden(
			"Solo el personal de un restaurante puede consultar turnos."
		)

	shift = get_object_or_404(
		Shift.objects.select_related("empleado", "empleado__profile"),
		pk=pk,
		restaurante_id=profile.restaurante_id,
	)

	if profile.rol == Profile.MESERO:
		if shift.empleado_id != request.user.pk:
			return Response(
				{"detail": "No encontrado."},
				status=status.HTTP_404_NOT_FOUND,
			)
		if request.method != "GET":
			return forbidden("El mesero solo puede consultar sus turnos.")

	if request.method == "GET":
		return Response(ShiftSerializer(shift).data)

	if request.method == "DELETE":
		shift.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

	serializer = ShiftSerializer(
		shift,
		data=request.data,
		partial=True,
		context={"request": request, "restaurante": profile.restaurante},
	)
	if serializer.is_valid():
		serializer.save()
		return Response(ShiftSerializer(shift).data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
