from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase

from restaurants.models import Restaurant
from tables.models import Table

from .models import TableReservation


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


class ReservationRoleTests(APITestCase):
	def setUp(self):
		self.client = APIClient()
		from django.contrib.auth import get_user_model

		from users.models import Profile

		self.restaurante = Restaurant.objects.create(nombre="Tienda")
		self.table = Table.objects.create(
			restaurante=self.restaurante, nombre="Mesa 1", capacidad=4
		)
		self.admin = get_user_model().objects.create_user(
			username="admin_reservas", password="x"
		)
		Profile.objects.create(
			user=self.admin,
			rol=Profile.ADMINISTRADOR,
			restaurante=self.restaurante,
		)
		self.mesero = get_user_model().objects.create_user(
			username="mesero_reservas", password="x"
		)
		Profile.objects.create(
			user=self.mesero,
			rol=Profile.MESERO,
			restaurante=self.restaurante,
		)
		self.cliente = get_user_model().objects.create_user(
			username="cliente_reserva_rol", password="x"
		)
		self.reserva = TableReservation.objects.create(
			restaurante=self.restaurante,
			mesa=self.table,
			user=self.cliente,
			fecha="2026-11-30",
			hora="20:00:00",
			personas=2,
			nombre="Cliente",
		)

	def test_admin_cannot_accept_reservation(self):
		self.client.force_authenticate(user=self.admin)
		response = self.client.post(f"/reservations/{self.reserva.pk}/accept/")
		self.assertEqual(response.status_code, 403)

	def test_waiter_can_accept_reservation(self):
		self.client.force_authenticate(user=self.mesero)
		response = self.client.post(f"/reservations/{self.reserva.pk}/accept/")
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["estado"], "aceptada")

	def test_waiter_sees_restaurant_reservations(self):
		self.client.force_authenticate(user=self.mesero)
		response = self.client.get("/reservations/")
		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["id"], str(self.reserva.pk))

	def test_admin_can_create_reservation(self):
		self.client.force_authenticate(user=self.admin)
		response = self.client.post(
			"/reservations/",
			{
				"restaurante": self.restaurante.pk,
				"mesa": self.table.pk,
				"fecha": "2026-11-30",
				"hora": "21:00:00",
				"personas": 2,
			},
			format="json",
		)
		self.assertEqual(response.status_code, 201)

	def test_waiter_can_complete_reservation_and_free_table(self):
		self.reserva.estado = TableReservation.ACCEPTADA
		self.reserva.save(update_fields=["estado"])
		self.table.esta_disponible = False
		self.table.save(update_fields=["esta_disponible"])

		self.client.force_authenticate(user=self.mesero)
		response = self.client.post(f"/reservations/{self.reserva.pk}/complete/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["estado"], "completada")
		self.table.refresh_from_db()
		self.assertTrue(self.table.esta_disponible)

