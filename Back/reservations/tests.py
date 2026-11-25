from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase

from restaurants.models import Restaurant
from tables.models import Table


class TableTests(TestCase):
	def test_table_str_and_defaults(self):
		restaurant = Restaurant.objects.create(nombre="Tienda")
		table = Table.objects.create(restaurante=restaurant, nombre="Mesa 1")
		self.assertEqual(str(table), f"{restaurant} · Mesa 1")
		self.assertEqual(table.capacidad, 4)
		self.assertTrue(table.esta_disponible)


class TableReservationApiTests(APITestCase):
	def setUp(self):
		self.client = APIClient()
		from django.contrib.auth import get_user_model

		self.user = get_user_model().objects.create_user(
			username="cliente_mesa", password="x"
		)
		self.restaurante = Restaurant.objects.create(nombre="Tienda")
		self.table = Table.objects.create(
			restaurante=self.restaurante, nombre="Mesa 1", capacidad=2
		)
		self.client.force_authenticate(user=self.user)

	def test_client_can_create_reservation(self):
		response = self.client.post(
			"/reservations/",
			{
				"restaurante": self.restaurante.pk,
				"mesa": self.table.pk,
				"fecha": "2026-11-30",
				"hora": "20:00:00",
				"personas": 2,
				"nombre": "Metal",
			},
			format="json",
		)
		self.assertEqual(response.status_code, 201)
		self.assertEqual(response.data["estado"], "pendiente")
		self.assertEqual(response.data["user"], self.user.pk)

	def test_wrong_restaurant_table_is_rejected(self):
		other = Restaurant.objects.create(nombre="Otra tienda")
		response = self.client.post(
			"/reservations/",
			{
				"restaurante": other.pk,
				"mesa": self.table.pk,
				"fecha": "2026-11-30",
				"hora": "20:00:00",
			},
			format="json",
		)
		self.assertEqual(response.status_code, 400)
		self.assertIn("mesa", response.data)
