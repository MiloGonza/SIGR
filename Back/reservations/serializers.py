from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import serializers

from tables.models import Table
from .models import TableReservation


class TableReservationSerializer(serializers.ModelSerializer):
	restaurante_nombre = serializers.CharField(
		source="restaurante.nombre", read_only=True
	)
	mesa_nombre = serializers.CharField(source="mesa.nombre", read_only=True)

	class Meta:
		model = TableReservation
		fields = [
			"id",
			"restaurante",
			"restaurante_nombre",
			"mesa",
			"mesa_nombre",
			"fecha",
			"hora",
			"personas",
			"nombre",
			"telefono",
			"notas",
			"estado",
			"user",
			"created_at",
			"updated_at",
		]
		read_only_fields = ["id", "estado", "user", "created_at", "updated_at"]

	def validate(self, attrs):
		restaurante = attrs.get("restaurante")
		mesa = attrs.get("mesa")
		fecha = attrs.get("fecha", getattr(self.instance, "fecha", None))
		personas = attrs.get(
			"personas", getattr(self.instance, "personas", 2)
		)

		if restaurante and mesa and mesa.restaurante_id != restaurante.pk:
			raise ValidationError(
				{"mesa": "La mesa no pertenece al restaurante."}
			)
		if fecha and fecha < timezone.localdate():
			raise ValidationError({"fecha": "La fecha ya ha pasado."})
		if personas < 1:
			raise ValidationError(
				{"personas": "Debe reservar al menos 1 persona."}
			)
		if mesa and personas > mesa.capacidad:
			raise ValidationError(
				{"personas": "Excede la capacidad de la mesa."}
			)
		return attrs
