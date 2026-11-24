from django.test import TestCase

from categories.models import Category
from restaurants.models import Restaurant

from .utils import unique_slug


class UniqueSlugTests(TestCase):
    def setUp(self):
        self.restaurante = Restaurant.objects.create(nombre="Otra tienda")
        self.categoria = Category.objects.create(nombre="Otra categoria")

    def test_unique_slug_returns_fallback_when_available(self):
        slug = unique_slug(Restaurant, "Nueva tienda", fallback="restaurante")
        self.assertEqual(slug, "nueva-tienda")

    def test_unique_slug_increments_suffix_for_duplicates(self):
        Restaurant.objects.create(nombre="Nueva tienda")
        slug = unique_slug(Restaurant, "Nueva tienda", fallback="restaurante")
        self.assertEqual(slug, "nueva-tienda-2")
        Restaurant.objects.create(nombre="Nueva tienda", slug="nueva-tienda-2")
        slug = unique_slug(Restaurant, "Nueva tienda", fallback="restaurante")
        self.assertEqual(slug, "nueva-tienda-3")

    def test_unique_slug_returns_fallback_for_blank_value(self):
        self.assertEqual(
            unique_slug(Restaurant, "   ", fallback="restaurante"),
            "restaurante",
        )
        self.assertEqual(
            unique_slug(Category, "   ", fallback="categoria"),
            "categoria",
        )
