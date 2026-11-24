from decimal import Decimal

from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from carts.models import Cart, CartItem
from restaurants.models import Category, Dish, Restaurant
from users.models import Profile


class CartApiTests(APITestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model

        self.user = get_user_model().objects.create_user(
            username="cliente_carrito", password="x"
        )
        self.restaurante = Restaurant.objects.create(nombre="Tienda")
        self.category = Category.objects.create(nombre="Categoria")
        self.dish = Dish.objects.create(
            nombre="Plato",
            restaurante=self.restaurante,
            categoria=self.category,
            precio=Decimal("5.00"),
            stock=10,
            is_active=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_cart_starts_empty_and_adds_item(self):
        response = self.client.get("/carts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items_count"], 0)

        response = self.client.post("/carts/items/", {"dish": self.dish.pk, "cantidad": 1}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["items_count"], 1)

        response = self.client.get("/carts/")
        self.assertEqual(response.data["items_count"], 1)
        item_id = response.data["items"][0]["id"]

        response = self.client.delete(f"/carts/items/{item_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(CartItem.objects.count(), 0)
