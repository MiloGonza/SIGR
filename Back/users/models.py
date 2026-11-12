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


class Address(models.Model):
	"""Direcciones de entrega guardadas por el cliente."""

	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="addresses",
	)
	alias = models.CharField(max_length=60, default="Casa")
	direccion = models.CharField(max_length=200)
	ciudad = models.CharField(max_length=100, default="Bogotá")
	notas = models.CharField(max_length=200, blank=True)
	is_default = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-is_default", "alias", "id"]

	def save(self, *args, **kwargs):
		super().save(*args, **kwargs)
		if self.is_default:
			Address.objects.filter(user=self.user).exclude(pk=self.pk).update(
				is_default=False
			)

	def __str__(self):
		return f"{self.alias}: {self.direccion}"


class PaymentMethod(models.Model):
	"""Método de pago guardado.

	No se almacena el número completo de la tarjeta ni el CVV. Solo se conserva
	la marca y los últimos cuatro dígitos, que es lo que la pasarela necesita
	para mostrar el método al cliente. El cobro real se hará en la pasarela.
	"""

	TARJETA = "tarjeta"
	NEQUI = "nequi"
	DAVIPLATA = "daviplata"
	PSE = "pse"
	EFECTIVO = "efectivo"

	TIPO_CHOICES = [
		(TARJETA, "Tarjeta"),
		(NEQUI, "Nequi"),
		(DAVIPLATA, "Daviplata"),
		(PSE, "PSE"),
		(EFECTIVO, "Efectivo"),
	]

	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="payment_methods",
	)
	tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TARJETA)
	alias = models.CharField(max_length=60, default="Mi tarjeta")
	titular = models.CharField(max_length=120, blank=True)
	marca = models.CharField(max_length=40, blank=True)
	ultimos4 = models.CharField(max_length=4, blank=True)
	mes_expira = models.PositiveSmallIntegerField(null=True, blank=True)
	anio_expira = models.PositiveSmallIntegerField(null=True, blank=True)
	is_default = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-is_default", "id"]

	def save(self, *args, **kwargs):
		super().save(*args, **kwargs)
		if self.is_default:
			PaymentMethod.objects.filter(user=self.user).exclude(pk=self.pk).update(
				is_default=False
			)

	def __str__(self):
		return f"{self.get_tipo_display()} {self.alias}"
