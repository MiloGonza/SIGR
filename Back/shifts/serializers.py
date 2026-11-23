from datetime import timedelta

from rest_framework import serializers

from users.models import Profile

from .models import Shift


STAFF_ROLES = (Profile.MESERO, Profile.ADMINISTRADOR)


def overlapping_shifts(empleado, fecha, hora_inicio, hora_fin, exclude_pk=None):
	"""Turnos del empleado que se cruzan con el intervalo indicado."""

	queryset = Shift.objects.filter(
		empleado=empleado,
		fecha=fecha,
		hora_inicio__lt=hora_fin,
		hora_fin__gt=hora_inicio,
	).exclude(estado=Shift.CANCELADO)
	if exclude_pk:
		queryset = queryset.exclude(pk=exclude_pk)
	return queryset


class ShiftSerializer(serializers.ModelSerializer):
	empleado_nombre = serializers.CharField(
		source="empleado.username", read_only=True
	)
	empleado_email = serializers.EmailField(source="empleado.email", read_only=True)
	empleado_rol = serializers.CharField(
		source="empleado.profile.rol", read_only=True
	)
	tipo_label = serializers.CharField(source="get_tipo_display", read_only=True)
	estado_label = serializers.CharField(
		source="get_estado_display", read_only=True
	)
	duracion_horas = serializers.FloatField(read_only=True)

	# Solo se usan al crear: repiten el turno cada 7 días.
	repeticiones = serializers.IntegerField(
		write_only=True,
		required=False,
		min_value=1,
		max_value=12,
	)
	omitir_conflictos = serializers.BooleanField(
		write_only=True, required=False, default=False
	)

	class Meta:
		model = Shift
		validators = []
		fields = [
			"id",
			"restaurante",
			"empleado",
			"empleado_nombre",
			"empleado_email",
			"empleado_rol",
			"fecha",
			"hora_inicio",
			"hora_fin",
			"tipo",
			"tipo_label",
			"estado",
			"estado_label",
			"notas",
			"duracion_horas",
			"repeticiones",
			"omitir_conflictos",
			"created_at",
			"updated_at",
		]
		read_only_fields = [
			"id",
			"restaurante",
			"empleado_nombre",
			"empleado_email",
			"empleado_rol",
			"tipo_label",
			"estado_label",
			"duracion_horas",
			"created_at",
			"updated_at",
		]

	def validate_empleado(self, value):
		restaurante = self.context.get("restaurante")
		profile = getattr(value, "profile", None)
		if restaurante is not None and (
			profile is None
			or profile.restaurante_id != restaurante.id
			or profile.rol not in STAFF_ROLES
		):
			raise serializers.ValidationError(
				"El empleado debe pertenecer al restaurante y tener rol de "
				"mesero o administrador."
			)
		return value

	def validate(self, attrs):
		hora_inicio = attrs.get(
			"hora_inicio", getattr(self.instance, "hora_inicio", None)
		)
		hora_fin = attrs.get("hora_fin", getattr(self.instance, "hora_fin", None))
		if hora_inicio and hora_fin and hora_fin <= hora_inicio:
			raise serializers.ValidationError(
				{"hora_fin": "La hora de fin debe ser posterior a la de inicio."}
			)

		empleado = attrs.get("empleado", getattr(self.instance, "empleado", None))
		fecha = attrs.get("fecha", getattr(self.instance, "fecha", None))
		# En creación, create() valida también las fechas repetidas.
		if (
			self.instance is not None
			and empleado
			and fecha
			and hora_inicio
			and hora_fin
		):
			conflict = overlapping_shifts(
				empleado,
				fecha,
				hora_inicio,
				hora_fin,
				exclude_pk=getattr(self.instance, "pk", None),
			).exists()
			if conflict:
				raise serializers.ValidationError(
					{
						"hora_inicio": (
							"El empleado ya tiene un turno que se cruza con "
							"este horario."
						)
					}
				)
		return attrs

	def create(self, validated_data):
		repeticiones = validated_data.pop("repeticiones", 1) or 1
		omitir = validated_data.pop("omitir_conflictos", False)
		restaurante = self.context["restaurante"]
		request = self.context.get("request")
		fecha_base = validated_data["fecha"]
		hora_inicio = validated_data["hora_inicio"]
		hora_fin = validated_data["hora_fin"]
		empleado = validated_data["empleado"]

		fechas = [
			fecha_base + timedelta(weeks=index)
			for index in range(repeticiones)
		]
		conflictos = [
			fecha
			for fecha in fechas
			if overlapping_shifts(
				empleado, fecha, hora_inicio, hora_fin
			).exists()
		]
		if conflictos and not omitir:
			if repeticiones == 1:
				raise serializers.ValidationError(
					{
						"hora_inicio": (
							"El empleado ya tiene un turno que se cruza con "
							"este horario."
						)
					}
				)
			raise serializers.ValidationError(
				{
					"fechas_conflicto": [
						fecha.isoformat() for fecha in conflictos
					],
					"detalle": (
						"Algunas fechas ya tienen un turno que se cruza. "
						"Envía omitir_conflictos=true para crear solo las "
						"demás."
					),
				}
			)

		creados = []
		for fecha in fechas:
			if fecha in conflictos:
				continue
			creados.append(
				Shift.objects.create(
					restaurante=restaurante,
					creado_por=getattr(request, "user", None),
					**{**validated_data, "fecha": fecha},
				)
			)

		if not creados:
			raise serializers.ValidationError(
				{
					"detalle": (
						"No se creó ningún turno: todas las fechas tienen "
						"conflictos."
					)
				}
			)

		self.created_shifts = creados
		self.omitidos = [fecha.isoformat() for fecha in conflictos]
		return creados[0]

	def update(self, instance, validated_data):
		validated_data.pop("repeticiones", None)
		validated_data.pop("omitir_conflictos", None)
		return super().update(instance, validated_data)
