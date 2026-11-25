from decimal import Decimal

from django.conf import settings
from django.db import models

from restaurants.models import Dish, Restaurant


class Cart(models.Model):
	"""Carrito activo de un cliente. Solo puede tener productos de una tienda."""

	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="cart",
	)
	restaurante = models.ForeignKey(
		Restaurant,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="carts",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"Carrito de {self.user}"

	@property
	def subtotal(self):
		return sum((item.subtotal for item in self.items.all()), Decimal("0.00"))

	@property
	def envio(self):
		if not self.restaurante or self.restaurante.free_shipping:
			return Decimal("0.00")
		return self.restaurante.shipping_cost

	@property
	def total(self):
		return self.subtotal + self.envio


class CartItem(models.Model):
	cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
	dish = models.ForeignKey(Dish, on_delete=models.CASCADE, related_name="cart_items")
	cantidad = models.PositiveSmallIntegerField(default=1)
	notas = models.CharField(max_length=200, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["id"]
		constraints = [
			models.UniqueConstraint(fields=["cart", "dish"], name="unique_cart_dish"),
		]

	@property
	def precio_unitario(self):
		return self.dish.precio

	@property
	def subtotal(self):
		return self.precio_unitario * self.cantidad

	def __str__(self):
		return f"{self.cantidad}x {self.dish.nombre}"
