from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import Address, PaymentMethod, Profile

from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
	AddCartItemSerializer,
	CartSerializer,
	CheckoutSerializer,
	OrderSerializer,
	OrderStatusSerializer,
	UpdateCartItemSerializer,
)


def get_cart(user):
	cart, _ = Cart.objects.get_or_create(user=user)
	return cart


def serialize_cart(cart, request):
	cart = (
		Cart.objects.filter(pk=cart.pk)
		.select_related("restaurante")
		.prefetch_related("items__dish__restaurante", "items__dish__categoria")
		.first()
	)
	return CartSerializer(cart, context={"request": request}).data


def payment_summary(method):
	if not method:
		return "Pago contra entrega"
	if method.ultimos4:
		return f"{method.marca or method.get_tipo_display()} •••• {method.ultimos4}"
	return method.get_tipo_display()


def user_is_restaurant_staff(user):
	profile = getattr(user, "profile", None)
	return bool(
		profile
		and profile.rol in (Profile.MESERO, Profile.ADMINISTRADOR)
		and profile.restaurante_id
	)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def cart_detail(request):
	"""Ver o vaciar el carrito del usuario autenticado."""
	cart = get_cart(request.user)
	if request.method == "DELETE":
		cart.items.all().delete()
		cart.restaurante = None
		cart.save(update_fields=["restaurante"])
	return Response(serialize_cart(cart, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_cart_item(request):
	serializer = AddCartItemSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	dish = serializer.validated_data["dish"]
	cantidad = serializer.validated_data.get("cantidad", 1)
	notas = serializer.validated_data.get("notas", "")
	cart = get_cart(request.user)

	if cart.restaurante_id and cart.restaurante_id != dish.restaurante_id:
		return Response(
			{
				"detail": (
					"Tu carrito tiene productos de otra tienda. "
					"Vacíalo o termina ese pedido antes de agregar este platillo."
				)
			},
			status=status.HTTP_400_BAD_REQUEST,
		)

	item, created = CartItem.objects.get_or_create(
		cart=cart,
		dish=dish,
		defaults={"cantidad": cantidad, "notas": notas},
	)
	if not created:
		item.cantidad = min(99, item.cantidad + cantidad)
		if notas:
			item.notas = notas
		item.save(update_fields=["cantidad", "notas"])

	cart.restaurante = dish.restaurante
	cart.save(update_fields=["restaurante"])
	return Response(
		serialize_cart(cart, request), status=status.HTTP_201_CREATED
	)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def cart_item_detail(request, pk):
	cart = get_cart(request.user)
	item = get_object_or_404(CartItem, pk=pk, cart=cart)

	if request.method == "DELETE":
		item.delete()
	else:
		serializer = UpdateCartItemSerializer(data=request.data)
		if not serializer.is_valid():
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
		cantidad = serializer.validated_data["cantidad"]
		if cantidad == 0:
			item.delete()
		else:
			item.cantidad = cantidad
			item.save(update_fields=["cantidad"])

	if not cart.items.exists():
		cart.restaurante = None
		cart.save(update_fields=["restaurante"])
	return Response(serialize_cart(cart, request))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def orders(request):
	"""Listar pedidos del cliente o crear uno a partir del carrito."""
	if request.method == "GET":
		queryset = (
			Order.objects.filter(user=request.user)
			.select_related("restaurante")
			.prefetch_related("items")
		)
		historial = request.query_params.get("historial")
		activos = request.query_params.get("activos")
		if historial in {"1", "true", "si", "sí"}:
			queryset = queryset.filter(
				estado__in=[Order.ENTREGADO, Order.CANCELADO]
			)
		elif activos in {"1", "true", "si", "sí"}:
			queryset = queryset.filter(
				estado__in=[
					Order.PENDIENTE,
					Order.CONFIRMADO,
					Order.PREPARANDO,
					Order.EN_CAMINO,
				]
			)
		serializer = OrderSerializer(
			queryset, many=True, context={"request": request}
		)
		return Response(serializer.data)

	cart = get_cart(request.user)
	if not cart.items.exists():
		return Response(
			{"detail": "Tu carrito está vacío."},
			status=status.HTTP_400_BAD_REQUEST,
		)

	serializer = CheckoutSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	address = serializer.validated_data["address"]
	if address.user_id != request.user.id:
		return Response(
			{"address": ["La dirección no pertenece a este usuario."]},
			status=status.HTTP_400_BAD_REQUEST,
		)

	payment_method = serializer.validated_data.get("payment_method")
	if payment_method and payment_method.user_id != request.user.id:
		return Response(
			{"payment_method": ["El método de pago no pertenece a este usuario."]},
			status=status.HTTP_400_BAD_REQUEST,
		)

	with transaction.atomic():
		cart = (
			Cart.objects.select_for_update()
			.prefetch_related("items__dish")
			.get(pk=cart.pk)
		)
		items = list(cart.items.all())
		if not items:
			return Response(
				{"detail": "Tu carrito está vacío."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		subtotal = sum((item.subtotal for item in items), Decimal("0.00"))
		envio = cart.envio
		prep_minutes = max(item.dish.prep_minutes for item in items)

		order = Order.objects.create(
			user=request.user,
			restaurante=cart.restaurante,
			address=address,
			direccion_entrega=address.direccion,
			ciudad_entrega=address.ciudad,
			payment_method=payment_method,
			metodo_pago_resumen=payment_summary(payment_method),
			estado=Order.CONFIRMADO,
			subtotal=subtotal,
			envio=envio,
			total=subtotal + envio,
			notas=serializer.validated_data.get("notas", ""),
			accepted_at=timezone.now(),
			prep_minutes=prep_minutes,
		)
		OrderItem.objects.bulk_create(
			[
				OrderItem(
					order=order,
					dish=item.dish,
					nombre=item.dish.nombre,
					precio_unitario=item.precio_unitario,
					cantidad=item.cantidad,
					prep_minutes=item.dish.prep_minutes,
				)
				for item in items
			]
		)
		cart.items.all().delete()
		cart.restaurante = None
		cart.save(update_fields=["restaurante"])

	order = (
		Order.objects.filter(pk=order.pk)
		.select_related("restaurante")
		.prefetch_related("items")
		.first()
	)
	return Response(
		OrderSerializer(order, context={"request": request}).data,
		status=status.HTTP_201_CREATED,
	)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
	order = get_object_or_404(
		Order.objects.select_related("restaurante").prefetch_related("items"),
		pk=pk,
	)
	if order.user_id != request.user.id and not user_is_restaurant_staff(
		request.user
	):
		return Response(status=status.HTTP_404_NOT_FOUND)
	return Response(OrderSerializer(order, context={"request": request}).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_order_status(request, pk):
	"""Cambiar el estado de un pedido. Solo meseros/administradores del local."""
	if not user_is_restaurant_staff(request.user):
		return Response(
			{"detail": "No tienes permiso para cambiar el estado de pedidos."},
			status=status.HTTP_403_FORBIDDEN,
		)

	order = get_object_or_404(Order, pk=pk)
	profile = request.user.profile
	if profile.rol != Profile.ADMINISTRADOR and order.restaurante_id != profile.restaurante_id:
		return Response(
			{"detail": "Este pedido no pertenece a tu local."},
			status=status.HTTP_403_FORBIDDEN,
		)

	serializer = OrderStatusSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	estado = serializer.validated_data["estado"]
	order.estado = estado
	if estado == Order.PREPARANDO and not order.accepted_at:
		order.accepted_at = timezone.now()
	if estado == Order.ENTREGADO:
		order.delivered_at = timezone.now()
	order.save(update_fields=["estado", "accepted_at", "delivered_at", "updated_at"])
	return Response(OrderSerializer(order, context={"request": request}).data)
