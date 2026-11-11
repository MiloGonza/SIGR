from django.conf import settings
from django.db import models

from restaurants.models import Restaurant


class Profile(models.Model):
	"""Datos extra del usuario de Django: rol y restaurante asociado."""

	CLIENTE = "cliente"
	MESERO = "mesero"
	ADMINISTRADOR = "administrador"

	ROLE_CHOICES = [
		(CLIENTE, "Cliente"),
		(MESERO, "Mesero"),
		(ADMINISTRADOR, "Administrador"),
	]

	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="profile",
	)
	rol = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CLIENTE)
	restaurante = models.ForeignKey(
		Restaurant,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="usuarios",
	)

	def __str__(self):
		return f"{self.user} ({self.rol})"
