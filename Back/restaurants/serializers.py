from decimal import Decimal

from rest_framework import serializers

from .models import Category, Dish, Restaurant


class RestaurantSerializer(serializers.ModelSerializer):
	tiempo = serializers.SerializerMethodField()
	envio = serializers.SerializerMethodField()

	class Meta:
		model = Restaurant
		fields = [
			"id",
			"nombre",
			"slug",
			"tipo",
			"descripcion",
			"rating",
			"rating_count",
			"delivery_min",
			"delivery_max",
			"shipping_cost",
			"free_shipping",
			"tags",
			"image",
			"icon",
			"gradient",
			"is_active",
			"tiempo",
			"envio",
		]
		read_only_fields = ["id", "slug"]

	def get_tiempo(self, obj):
		return f"{obj.delivery_min}-{obj.delivery_max} min"

	def get_envio(self, obj):
		if obj.free_shipping:
			return "Envío gratis"
		valor = Decimal(obj.shipping_cost)
		formatted = f"{valor:,.0f}".replace(",", ".")
		return f"${formatted}"


class RestaurantMiniSerializer(serializers.ModelSerializer):
	class Meta:
		model = Restaurant
		fields = ["id", "nombre", "slug", "icon", "gradient"]


class CategorySerializer(serializers.ModelSerializer):
	class Meta:
		model = Category
		fields = ["id", "nombre", "slug", "icon", "orden", "is_active"]
		read_only_fields = ["id"]


class DishSerializer(serializers.ModelSerializer):
	restaurante_nombre = serializers.CharField(
		source="restaurante.nombre", read_only=True
	)
	categoria_nombre = serializers.CharField(
		source="categoria.nombre", read_only=True, default=""
	)

	class Meta:
		model = Dish
		fields = [
			"id",
			"restaurante",
			"restaurante_nombre",
			"categoria",
			"categoria_nombre",
			"nombre",
			"descripcion",
			"precio",
			"rating",
			"rating_count",
			"etiqueta",
			"prep_minutes",
			"image",
			"icon",
			"gradient",
			"is_active",
		]
		read_only_fields = ["id"]
