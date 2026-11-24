from django.test import TestCase

from categories.models import Category
from orders.models import Order
from payment_methods.models import PaymentMethod
from restaurants.models import Dish, Restaurant


class ModularAppsStructureTests(TestCase):
    def test_dish_categoria_belongs_to_categories_app(self):
        field = Dish._meta.get_field("categoria")
        self.assertEqual(field.remote_field.model, Category)

    def test_restaurant_has_own_category_model(self):
        self.assertEqual(Restaurant._meta.app_label, "restaurants")

    def test_order_payment_method_belongs_to_payment_methods_app(self):
        field = Order._meta.get_field("payment_method")
        self.assertEqual(field.remote_field.model, PaymentMethod)

    def test_cart_item_belongs_to_carts_app(self):
        from carts.models import Cart, CartItem

        self.assertEqual(CartItem._meta.app_label, "carts")
