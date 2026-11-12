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
			"stock",
			"image",
			"icon",
			"gradient",
			"is_active",
		]
		read_only_fields = ["id"]


class AdminDishSerializer(serializers.ModelSerializer):
	"""Platillo editable desde el panel del administrador."""

	categoria_nombre = serializers.CharField(
		source="categoria.nombre", read_only=True, default=""
	)
	remove_image = serializers.BooleanField(write_only=True, required=False, default=False)

	class Meta:
		model = Dish
		fields = [
			"id",
			"categoria",
			"categoria_nombre",
			"nombre",
			"descripcion",
			"precio",
			"etiqueta",
			"prep_minutes",
			"stock",
			"image",
			"remove_image",
			"icon",
			"gradient",
			"is_active",
		]
		read_only_fields = ["id"]

	def validate_image(self, value):
		if value is None:
			return value
		if value.size > 5 * 1024 * 1024:
			raise serializers.ValidationError(
				"La imagen no puede superar los 5 MB."
			)
		content_type = getattr(value, "content_type", "")
		allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
		if content_type and content_type not in allowed:
			raise serializers.ValidationError(
				"Formato no válido. Usa JPG, PNG, WEBP o GIF."
			)
		return value

	def create(self, validated_data):
		validated_data.pop("remove_image", None)
		return super().create(validated_data)

	def update(self, instance, validated_data):
		remove_image = validated_data.pop("remove_image", False)
		old_name = instance.image.name if instance.image else ""
		if remove_image and not validated_data.get("image"):
			instance.image.delete(save=False)
			instance.image = ""
		instance = super().update(instance, validated_data)
		new_name = instance.image.name if instance.image else ""
		if old_name and old_name != new_name:
			# Solo borramos el archivo si ningún otro platillo lo comparte.
			if not Dish.objects.filter(image=old_name).exists():
				instance._meta.get_field("image").storage.delete(old_name)
		return instance

	def validate_precio(self, value):
		if value <= 0:
			raise serializers.ValidationError("El precio debe ser mayor que cero.")
		return value

	def validate_nombre(self, value):
		nombre = value.strip()
		if not nombre:
			raise serializers.ValidationError("El nombre no puede estar vacío.")
		return nombre
