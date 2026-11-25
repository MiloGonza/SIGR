from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from restaurants.models import Restaurant
from users.models import Profile

from .models import Category


class CategoryApiTests(APITestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model

        self.restaurante = Restaurant.objects.create(nombre="Tienda")
        self.admin = get_user_model().objects.create_user(
            username="admin_categorias", password="x"
        )
        Profile.objects.create(
            user=self.admin,
            rol=Profile.ADMINISTRADOR,
            restaurante=self.restaurante,
        )
        self.client.force_authenticate(user=self.admin)

    def test_public_categories_include_created(self):
        Category.objects.create(nombre="Postres")
        response = self.client.get("/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([c["nombre"] for c in response.data], ["Postres"])

    def test_admin_can_create_category(self):
        response = self.client.post("/categories/manage/", {"nombre": "Postres"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["nombre"], "Postres")
        self.assertEqual(response.data["platillos_count"], 0)

    def test_duplicate_category_is_rejected(self):
        Category.objects.create(nombre="Postres")
        response = self.client.post("/categories/manage/", {"nombre": "postres"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_blank_category_name_is_rejected(self):
        response = self.client.post("/categories/manage/", {"nombre": "   "})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_rename_category(self):
        category = Category.objects.create(nombre="Postres")
        response = self.client.patch(
            f"/categories/manage/{category.pk}/", {"nombre": "Helados"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre"], "Helados")
