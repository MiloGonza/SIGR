from datetime import date, time

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from restaurants.models import Restaurant
from users.models import Profile

from .models import Shift


class ShiftModelTests(APITestCase):
    def setUp(self):
        self.restaurante = Restaurant.objects.create(nombre="Tienda")
        self.empleado = get_user_model().objects.create_user(
            username="empleado_turnos", password="x"
        )
        Profile.objects.create(
            user=self.empleado,
            rol=Profile.MESERO,
            restaurante=self.restaurante,
        )

    def test_shift_duration_is_calculated(self):
        shift = Shift.objects.create(
            restaurante=self.restaurante,
            empleado=self.empleado,
            fecha=date(2026, 11, 12),
            hora_inicio=time(9, 0),
            hora_fin=time(17, 30),
        )
        self.assertEqual(shift.duracion_horas, 8.5)

    def test_shifts_list_starts_empty(self):
        self.assertEqual(Shift.objects.count(), 0)


class ShiftsApiTests(APITestCase):
    def setUp(self):
        self.restaurante = Restaurant.objects.create(nombre="Tienda")
        self.admin = get_user_model().objects.create_user(
            username="admin_turnos", password="x"
        )
        Profile.objects.create(
            user=self.admin,
            rol=Profile.ADMINISTRADOR,
            restaurante=self.restaurante,
        )
        self.mesero = get_user_model().objects.create_user(
            username="mesero_turnos", password="x"
        )
        Profile.objects.create(
            user=self.mesero,
            rol=Profile.MESERO,
            restaurante=self.restaurante,
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_create_shift(self):
        response = self.client.post(
            "/shifts/",
            {
                "empleado": self.mesero.pk,
                "fecha": "2026-11-12",
                "hora_inicio": "09:00",
                "hora_fin": "17:30",
                "tipo": Shift.MANANA,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["turnos"]), 1)

    def test_mesero_can_list_own_shift_and_not_others(self):
        Shift.objects.create(
            restaurante=self.restaurante,
            empleado=self.mesero,
            fecha=date(2026, 11, 12),
            hora_inicio=time(9, 0),
            hora_fin=time(17, 30),
        )
        response = self.client.get("/shifts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.mesero)
        response = self.client.get("/shifts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(shift["empleado_nombre"] == self.mesero.username for shift in response.data))

    def test_regular_user_cannot_list_shifts(self):
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.create_user(
            username="cliente_turnos", password="x"
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/shifts/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
