import uuid

from django.db import models


class Table(models.Model):
	id = models.UUIDField(
		default=uuid.uuid4, editable=False, primary_key=True, serialize=False
	)
	restaurante = models.ForeignKey(
		"restaurants.Restaurant",
		on_delete=models.CASCADE,
		related_name="mesas",
	)
	nombre = models.CharField(max_length=50)
	capacidad = models.PositiveSmallIntegerField(default=4)
	esta_disponible = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["restaurante", "nombre"]

	def __str__(self):
		return f"{self.restaurante} · {self.nombre}"
