from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Cart, CartItem
from .serializers import (
	AddCartItemSerializer,
	CartSerializer,
	UpdateCartItemSerializer,
)
from .services import get_cart


def serialize_cart(cart, request):
	cart = (
		Cart.objects.filter(pk=cart.pk)
		.select_related("restaurante")
		.prefetch_related("items__dish__restaurante", "items__dish__categoria")
		.first()
	)
	return CartSerializer(cart, context={"request": request}).data


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

	existing = CartItem.objects.filter(cart=cart, dish=dish).first()
	requested = cantidad + (existing.cantidad if existing else 0)
	if dish.stock <= 0:
		return Response(
			{"detail": "Este platillo está agotado."},
			status=status.HTTP_400_BAD_REQUEST,
		)
	if requested > dish.stock:
		return Response(
			{
				"detail": (
					f"Solo hay {dish.stock} unidades disponibles de este platillo."
				)
			},
			status=status.HTTP_400_BAD_REQUEST,
		)

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
			if cantidad > item.dish.stock:
				return Response(
					{
						"detail": (
							f"Solo hay {item.dish.stock} unidades disponibles "
							"de este platillo."
						)
					},
					status=status.HTTP_400_BAD_REQUEST,
				)
			item.cantidad = cantidad
			item.save(update_fields=["cantidad"])

	if not cart.items.exists():
		cart.restaurante = None
		cart.save(update_fields=["restaurante"])
	return Response(serialize_cart(cart, request))
