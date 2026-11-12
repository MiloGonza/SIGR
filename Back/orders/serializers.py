from rest_framework import serializers

from restaurants.models import Dish
from restaurants.serializers import DishSerializer, RestaurantMiniSerializer
from users.models import Address, PaymentMethod

from .models import Cart, CartItem, Order, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
	dish = DishSerializer(read_only=True)
	precio_unitario = serializers.DecimalField(
		max_digits=10, decimal_places=2, read_only=True
	)
	subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

	class Meta:
		model = CartItem
		fields = ["id", "dish", "cantidad", "notas", "precio_unitario", "subtotal"]


class CartSerializer(serializers.ModelSerializer):
	items = CartItemSerializer(many=True, read_only=True)
	restaurante_detalle = RestaurantMiniSerializer(
		source="restaurante", read_only=True
	)
	tienda = serializers.CharField(source="restaurante.nombre", read_only=True, default="")
	subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
	envio = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
	total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
	items_count = serializers.SerializerMethodField()

	class Meta:
		model = Cart
		fields = [
			"id",
			"restaurante",
			"restaurante_detalle",
			"tienda",
			"items",
			"items_count",
			"subtotal",
			"envio",
			"total",
		]

	def get_items_count(self, obj):
		return sum(item.cantidad for item in obj.items.all())


class AddCartItemSerializer(serializers.Serializer):
	dish = serializers.PrimaryKeyRelatedField(
		queryset=Dish.objects.filter(is_active=True)
	)
	cantidad = serializers.IntegerField(min_value=1, max_value=99, default=1)
	notas = serializers.CharField(required=False, allow_blank=True, max_length=200)


class UpdateCartItemSerializer(serializers.Serializer):
	cantidad = serializers.IntegerField(min_value=0, max_value=99)


class OrderItemSerializer(serializers.ModelSerializer):
	subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

	class Meta:
		model = OrderItem
		fields = [
			"id",
			"dish",
			"nombre",
			"precio_unitario",
			"cantidad",
			"prep_minutes",
			"subtotal",
		]


class OrderSerializer(serializers.ModelSerializer):
	items = OrderItemSerializer(many=True, read_only=True)
	tienda = serializers.CharField(source="restaurante.nombre", read_only=True)
	estado_label = serializers.CharField(source="get_estado_display", read_only=True)
	ready_at = serializers.DateTimeField(read_only=True)
	metodo_pago = serializers.CharField(
		source="metodo_pago_resumen", read_only=True, default=""
	)

	class Meta:
		model = Order
		fields = [
			"id",
			"numero",
			"restaurante",
			"tienda",
			"direccion_entrega",
			"ciudad_entrega",
			"metodo_pago",
			"estado",
			"estado_label",
			"subtotal",
			"envio",
			"total",
			"notas",
			"accepted_at",
			"prep_minutes",
			"ready_at",
			"delivered_at",
			"created_at",
			"items",
		]


class CheckoutSerializer(serializers.Serializer):
	address = serializers.PrimaryKeyRelatedField(queryset=Address.objects.all())
	payment_method = serializers.PrimaryKeyRelatedField(
		queryset=PaymentMethod.objects.all(), required=False, allow_null=True
	)
	notas = serializers.CharField(required=False, allow_blank=True, max_length=500)


class OrderStatusSerializer(serializers.Serializer):
	estado = serializers.ChoiceField(choices=Order.ESTADO_CHOICES)
