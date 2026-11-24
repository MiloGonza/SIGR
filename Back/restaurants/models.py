import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from categories.models import Category
from common.utils import unique_slug


class Restaurant(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, auto_created=True)
	nombre = models.CharField(max_length=100)
	slug = models.SlugField(max_length=150, unique=True, blank=True, null=True)

	# Datos de vitrina para el cliente. Los restaurantes creados antes de estos
	# campos quedan con los valores por defecto y se pueden completar desde el admin.
	tipo = models.CharField(max_length=120, default="Restaurante")
	descripcion = models.TextField(blank=True)
	rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
	rating_count = models.PositiveIntegerField(default=0)
	delivery_min = models.PositiveSmallIntegerField(default=20)
	delivery_max = models.PositiveSmallIntegerField(default=35)
	shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	free_shipping = models.BooleanField(default=False)
	tags = models.JSONField(default=list, blank=True)
	image = models.FileField(upload_to="stores/", blank=True)
	icon = models.CharField(max_length=40, default="ChefHat")
	gradient = models.CharField(
		max_length=200,
		default="linear-gradient(135deg, #7f1d1d 0%, #c2410c 100%)",
	)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(default=timezone.now)

	class Meta:
		ordering = ["nombre"]

	def save(self, *args, **kwargs):
		if not self.slug:
			self.slug = unique_slug(
				Restaurant, self.nombre, self.pk, fallback="restaurante"
			)
		super().save(*args, **kwargs)

	def __str__(self):
		return self.nombre


class Dish(models.Model):
	restaurante = models.ForeignKey(
		Restaurant,
		on_delete=models.CASCADE,
		related_name="platillos",
	)
	categoria = models.ForeignKey(
		Category,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="platillos",
	)
	nombre = models.CharField(max_length=120)
	descripcion = models.TextField(blank=True)
	precio = models.DecimalField(max_digits=10, decimal_places=2)
	rating = models.DecimalField(max_digits=3, decimal_places=1, default=0)
	rating_count = models.PositiveIntegerField(default=0)
	etiqueta = models.CharField(max_length=60, blank=True)
	prep_minutes = models.PositiveSmallIntegerField(default=15)
	stock = models.PositiveIntegerField(default=0)
	image = models.FileField(upload_to="dishes/", blank=True)
	icon = models.CharField(max_length=40, default="ChefHat")
	gradient = models.CharField(
		max_length=200,
		default="linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
	)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["nombre"]
		verbose_name_plural = "dishes"

	def __str__(self):
		return f"{self.nombre} - {self.restaurante}"


class Notification(models.Model):
	"""Aviso interno para el personal de una tienda."""

	NO_DISPONIBLE = "no_disponible"
	DISPONIBLE = "disponible"
	AGOTADO = "agotado"
	STOCK = "stock"
	PEDIDO = "pedido"

	TIPO_CHOICES = [
		(NO_DISPONIBLE, "No disponible"),
		(DISPONIBLE, "Disponible"),
		(AGOTADO, "Agotado"),
		(STOCK, "Stock actualizado"),
		(PEDIDO, "Nuevo pedido"),
	]

	restaurante = models.ForeignKey(
		Restaurant,
		on_delete=models.CASCADE,
		related_name="notificaciones",
	)
	dish = models.ForeignKey(
		Dish,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="notificaciones",
	)
	actor = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="notificaciones_staff",
	)
	tipo = models.CharField(
		max_length=20, choices=TIPO_CHOICES, default=NO_DISPONIBLE
	)
	mensaje = models.CharField(max_length=255)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-created_at", "-id"]
		indexes = [
			models.Index(
				fields=["restaurante", "-created_at"],
				name="notif_rest_created_idx",
			)
		]

	def __str__(self):
		return f"{self.restaurante} · {self.mensaje}"
