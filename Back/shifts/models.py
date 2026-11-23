import uuid
from datetime import datetime

from django.conf import settings
from django.db import models

from restaurants.models import Restaurant


class Shift(models.Model):
	"""Turno programado para un empleado de un restaurante."""

	MANANA = "manana"
	TARDE = "tarde"
	NOCHE = "noche"

	TIPO_CHOICES = [
		(MANANA, "Mañana"),
		(TARDE, "Tarde"),
		(NOCHE, "Noche"),
	]

	PROGRAMADO = "programado"
	CONFIRMADO = "confirmado"
	COMPLETADO = "completado"
	CANCELADO = "cancelado"

	ESTADO_CHOICES = [
		(PROGRAMADO, "Programado"),
		(CONFIRMADO, "Confirmado"),
		(COMPLETADO, "Completado"),
		(CANCELADO, "Cancelado"),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	restaurante = models.ForeignKey(
		Restaurant,
		on_delete=models.CASCADE,
		related_name="turnos",
	)
	empleado = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="turnos",
	)
	fecha = models.DateField()
	hora_inicio = models.TimeField()
	hora_fin = models.TimeField()
	tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default=MANANA)
	estado = models.CharField(
		max_length=12, choices=ESTADO_CHOICES, default=PROGRAMADO
	)
	notas = models.TextField(blank=True)
	creado_por = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="turnos_creados",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["fecha", "hora_inicio"]
		indexes = [
			models.Index(
				fields=["restaurante", "fecha"],
				name="shift_rest_fecha_idx",
			),
			models.Index(
				fields=["empleado", "fecha"],
				name="shift_emp_fecha_idx",
			),
		]

	def __str__(self):
		return (
			f"{self.empleado} · {self.fecha} "
			f"{self.hora_inicio:%H:%M}-{self.hora_fin:%H:%M}"
		)

	@property
	def duracion_horas(self):
		inicio = datetime.combine(self.fecha, self.hora_inicio)
		fin = datetime.combine(self.fecha, self.hora_fin)
		return round((fin - inicio).total_seconds() / 3600, 2)
