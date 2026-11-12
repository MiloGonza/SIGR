import uuid
from datetime import timedelta
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


def generate_order_number():
	return f"PY-{uuid.uuid4().hex[:6].upper()}"


class Order(models.Model):
	PENDIENTE = "pendiente"
	CONFIRMADO = "confirmado"
	PREPARANDO = "preparando"
	EN_CAMINO = "en_camino"
	ENTREGADO = "entregado"
	CANCELADO = "cancelado"

	ESTADO_CHOICES = [
		(PENDIENTE, "Pendiente"),
		(CONFIRMADO, "Confirmado"),
		(PREPARANDO, "En preparación"),
		(EN_CAMINO, "En camino"),
		(ENTREGADO, "Entregado"),
		(CANCELADO, "Cancelado"),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	numero = models.CharField(max_length=20, unique=True, editable=False)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="orders",
	)
	restaurante = models.ForeignKey(
		Restaurant,
		on_delete=models.PROTECT,
		related_name="orders",
	)
	address = models.ForeignKey(
		"users.Address",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="orders",
	)
	direccion_entrega = models.CharField(max_length=200)
	ciudad_entrega = models.CharField(max_length=100, blank=True)
	payment_method = models.ForeignKey(
		"users.PaymentMethod",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="orders",
	)
	metodo_pago_resumen = models.CharField(max_length=120, blank=True)
	estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default=CONFIRMADO)
	subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	envio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	notas = models.TextField(blank=True)
	accepted_at = models.DateTimeField(null=True, blank=True)
	prep_minutes = models.PositiveSmallIntegerField(default=0)
	delivered_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]

	def save(self, *args, **kwargs):
		if not self.numero:
			numero = generate_order_number()
			while Order.objects.filter(numero=numero).exists():
				numero = generate_order_number()
			self.numero = numero
		super().save(*args, **kwargs)

	@property
	def ready_at(self):
		if not self.accepted_at:
			return None
		return self.accepted_at + timedelta(minutes=self.prep_minutes)

	def __str__(self):
		return f"{self.numero} - {self.restaurante}"


class OrderItem(models.Model):
	order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
	dish = models.ForeignKey(
		Dish,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="order_items",
	)
	nombre = models.CharField(max_length=120)
	precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
	cantidad = models.PositiveSmallIntegerField(default=1)
	prep_minutes = models.PositiveSmallIntegerField(default=0)

	class Meta:
		ordering = ["id"]

	@property
	def subtotal(self):
		return self.precio_unitario * self.cantidad

	def __str__(self):
		return f"{self.cantidad}x {self.nombre}"
