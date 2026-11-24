from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import PaymentMethod
from .utils import normalize_payment_summary


class PaymentMethodsApiTests(APITestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model

        self.user = get_user_model().objects.create_user(
            username="cliente_pago", password="x"
        )
        self.client.force_authenticate(user=self.user)

    def test_create_card_only_shows_last_four(self):
        response = self.client.post(
            "/payment-methods/",
            {
                "tipo": PaymentMethod.TARJETA,
                "numero_tarjeta": "4111111111111111",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["ultimos4"], "1111")
        self.assertEqual(response.data["marca"], "Visa")

        response = self.client.get("/payment-methods/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_normalize_payment_summary_groups_card_without_digits(self):
        self.assertEqual(
            normalize_payment_summary("Visa •••• 4242"),
            "Tarjeta",
        )
        self.assertEqual(normalize_payment_summary("Mastercard •••• 4444"), "Tarjeta")
        self.assertEqual(normalize_payment_summary(""), "Pago contra entrega")
        self.assertEqual(normalize_payment_summary("Nequi"), "Nequi")
        self.assertEqual(normalize_payment_summary("Daviplata"), "Daviplata")
