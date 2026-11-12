import uuid

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def unique_slug(model, value, instance_pk=None):
	"""Genera un slug único para los modelos que lo usan."""
	base = slugify(value) or "restaurante"
	slug = base
	counter = 2
	while model.objects.filter(slug=slug).exclude(pk=instance_pk).exists():
		slug = f"{base}-{counter}"
		counter += 1
	return slug


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
			self.slug = unique_slug(Restaurant, self.nombre, self.pk)
		super().save(*args, **kwargs)

	def __str__(self):
		return self.nombre


class Category(models.Model):
	nombre = models.CharField(max_length=80, unique=True)
	slug = models.SlugField(max_length=100, unique=True, blank=True)
	icon = models.CharField(max_length=40, default="UtensilsCrossed")
	orden = models.PositiveSmallIntegerField(default=0)
	is_active = models.BooleanField(default=True)

	class Meta:
		ordering = ["orden", "nombre"]
		verbose_name_plural = "categories"

	def save(self, *args, **kwargs):
		if not self.slug:
			self.slug = slugify(self.nombre) or "categoria"
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
