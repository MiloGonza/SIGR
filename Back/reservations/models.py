import uuid

from django.conf import settings
from django.db import models


class TableReservation(models.Model):
	"""Petición de mesa hecha por un cliente y verificada por el personal."""

	PENDIENTE = "pendiente"
	ACCEPTADA = "aceptada"
	CANCELADA = "cancelada"

	ESTADO_CHOICES = [
		(PENDIENTE, "Pendiente"),
		(ACCEPTADA, "Aceptada"),
		(CANCELADA, "Cancelada"),
	]

	id = models.UUIDField(
		primary_key=True, default=uuid.uuid4, editable=False
	)
	restaurante = models.ForeignKey(
		"restaurants.Restaurant",
		on_delete=models.CASCADE,
		related_name="reservas",
	)
	mesa = models.ForeignKey(
		"tables.Table",
		on_delete=models.CASCADE,
		related_name="reservas",
		verbose_name="Mesa",
	)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="reservas_mesa",
	)
	fecha = models.DateField()
	hora = models.TimeField()
	personas = models.PositiveSmallIntegerField(default=2)
	nombre = models.CharField(max_length=120, blank=True)
	telefono = models.CharField(max_length=30, blank=True)
	notas = models.TextField(blank=True)
	estado = models.CharField(
		max_length=20, choices=ESTADO_CHOICES, default=PENDIENTE
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-fecha", "-hora", "-created_at"]
		constraints = [
			models.CheckConstraint(
				condition=models.Q(personas__gte=1),
				name="reservas_mesa_personas_gte_1",
			),
		]

	def __str__(self):
		return f"{self.restaurante} · {self.mesa} · {self.fecha}"
