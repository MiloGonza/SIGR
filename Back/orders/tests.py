from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase

from payment_methods.models import PaymentMethod
from restaurants.models import Restaurant

from .models import Order


class OrderModelTests(TestCase):
    def setUp(self):
        self.restaurante = Restaurant.objects.create(nombre="Tienda")
        self.user = get_user_model().objects.create_user(
            username="cliente_orders", password="x"
        )

    def test_order_generates_unique_number_and_is_pending(self):
        order = Order.objects.create(
            restaurante=self.restaurante,
            user=self.user,
            direccion_entrega="Calle ejemplo 123",
            subtotal=Decimal("5.00"),
        )
        self.assertTrue(order.numero.startswith("PY-"))
        self.assertEqual(order.estado, Order.PENDIENTE)
        self.assertEqual(order.metodo_pago_resumen, "")
        self.assertIsNone(order.payment_method)

    def test_order_payment_method_belongs_to_payment_methods_app(self):
        field = Order._meta.get_field("payment_method")
        self.assertEqual(field.remote_field.model, PaymentMethod)
