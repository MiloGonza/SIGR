from django.test import TestCase

from restaurants.models import Category


class RestaurantSlugTests(TestCase):
    def test_restaurant_slug_fallback_is_restaurante(self):
        from restaurants.models import Restaurant

        restaurant = Restaurant.objects.create(nombre="Restaurante Nuevo")
        self.assertEqual(restaurant.slug, "restaurante-nuevo")

    def test_duplicate_restaurant_slug_gets_suffix(self):
        from restaurants.models import Restaurant

        Restaurant.objects.create(nombre="Restaurante Nuevo")
        restaurant = Restaurant.objects.create(nombre="Restaurante Nuevo")
        self.assertEqual(restaurant.slug, "restaurante-nuevo-2")

    def test_category_slug_fallback_is_categoria(self):
        category = Category.objects.create(nombre="Postres")
        self.assertEqual(category.slug, "postres")
