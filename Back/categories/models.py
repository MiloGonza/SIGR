from django.db import models

from common.utils import unique_slug


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
		nombre_anterior = None
		if self.pk:
			nombre_anterior = (
				type(self)
				.objects.filter(pk=self.pk)
				.values_list("nombre", flat=True)
				.first()
			)
		if not self.slug or (
			nombre_anterior is not None and nombre_anterior != self.nombre
		):
			self.slug = unique_slug(
				type(self), self.nombre, self.pk, fallback="categoria"
			)
		super().save(*args, **kwargs)

	def __str__(self):
		return self.nombre
