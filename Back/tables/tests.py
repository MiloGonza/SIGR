from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from restaurants.models import Restaurant
from users.models import Profile

from .models import Table


class AdminTableApiTests(APITestCase):
    def setUp(self):
        self.restaurante = Restaurant.objects.create(nombre="Tienda mesas")
        self.admin = get_user_model().objects.create_user(
            username="admin_mesas", password="x"
        )
        Profile.objects.create(
            user=self.admin,
            rol=Profile.ADMINISTRADOR,
            restaurante=self.restaurante,
        )
        self.client.force_authenticate(user=self.admin)

    def test_create_table_uses_admin_restaurant_without_payload(self):
        response = self.client.post(
            "/tables/",
            {"nombre": "Terraza", "capacidad": 4, "esta_disponible": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["restaurante"], self.restaurante.id)
        self.assertEqual(Table.objects.get().restaurante, self.restaurante)

    def test_update_and_delete_table_by_uuid(self):
        table = Table.objects.create(
            restaurante=self.restaurante, nombre="Terraza", capacidad=4
        )
        response = self.client.patch(
            f"/tables/{table.id}/", {"nombre": "Terraza 2"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre"], "Terraza 2")

        response = self.client.delete(f"/tables/{table.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Table.objects.exists())

    def test_non_admin_cannot_list_tables(self):
        user = get_user_model().objects.create_user(username="cliente", password="x")
        self.client.force_authenticate(user=user)
        response = self.client.get("/tables/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class StaffTableApiTests(APITestCase):
    def setUp(self):
        self.restaurante = Restaurant.objects.create(nombre="Tienda sala")
        self.otro = Restaurant.objects.create(nombre="Otra tienda")
        self.mesa = Table.objects.create(
            restaurante=self.restaurante, nombre="Mesa 1", capacidad=4
        )
        Table.objects.create(restaurante=self.otro, nombre="Mesa ajena", capacidad=2)
        self.mesero = get_user_model().objects.create_user(
            username="mesero_mesas", password="x"
        )
        Profile.objects.create(
            user=self.mesero,
            rol=Profile.MESERO,
            restaurante=self.restaurante,
        )

    def test_waiter_sees_only_his_restaurant_tables(self):
        self.client.force_authenticate(user=self.mesero)
        response = self.client.get("/tables/staff/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(self.mesa.id))

    def test_admin_cannot_use_staff_tables(self):
        admin = get_user_model().objects.create_user(
            username="admin_sala", password="x"
        )
        Profile.objects.create(
            user=admin,
            rol=Profile.ADMINISTRADOR,
            restaurante=self.restaurante,
        )
        self.client.force_authenticate(user=admin)
        response = self.client.get("/tables/staff/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_cannot_use_staff_tables(self):
        cliente = get_user_model().objects.create_user(
            username="cliente_sala", password="x"
        )
        self.client.force_authenticate(user=cliente)
        response = self.client.get("/tables/staff/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
