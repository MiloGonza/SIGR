from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.db.models import Count, DecimalField, F, Sum
from django.db.models.functions import ExtractHour, TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import Address, PaymentMethod, Profile
from restaurants.models import Dish

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

		locked_dishes = {
			dish.pk: dish
			for dish in Dish.objects.select_for_update().filter(
				pk__in=[item.dish_id for item in items]
			)
		}
		for item in items:
			dish = locked_dishes.get(item.dish_id)
			if not dish or not dish.is_active or dish.stock <= 0:
				return Response(
					{
						"detail": (
							f"{item.dish.nombre} ya no está disponible. "
							"Quítalo del carrito para continuar."
						)
					},
					status=status.HTTP_400_BAD_REQUEST,
				)
			if item.cantidad > dish.stock:
				return Response(
					{
						"detail": (
							f"Solo hay {dish.stock} unidades de {dish.nombre}. "
							"Ajusta la cantidad en tu carrito."
						)
					},
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
		for item in items:
			dish = locked_dishes[item.dish_id]
			dish.stock -= item.cantidad
			dish.save(update_fields=["stock"])
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
	anterior = order.estado
	order.estado = estado
	if estado == Order.PREPARANDO and not order.accepted_at:
		order.accepted_at = timezone.now()
	if estado == Order.ENTREGADO:
		order.delivered_at = timezone.now()
	with transaction.atomic():
		order.save(
			update_fields=["estado", "accepted_at", "delivered_at", "updated_at"]
		)
		if estado == Order.CANCELADO and anterior != Order.CANCELADO:
			for item in order.items.exclude(dish__isnull=True):
				Dish.objects.filter(pk=item.dish_id).update(
					stock=F("stock") + item.cantidad
				)
	return Response(OrderSerializer(order, context={"request": request}).data)


def admin_profile_for_stats(user):
	profile = getattr(user, "profile", None)
	if profile and profile.rol == Profile.ADMINISTRADOR and profile.restaurante_id:
		return profile
	return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def restaurant_stats(request):
	"""Resumen analítico del restaurante para el panel del administrador."""
	profile = admin_profile_for_stats(request.user)
	if not profile:
		return Response(
			{
				"detail": (
					"Solo el administrador de un restaurante puede ver "
					"las estadísticas."
				)
			},
			status=status.HTTP_403_FORBIDDEN,
		)

	try:
		dias = int(request.query_params.get("dias", 30))
	except (TypeError, ValueError):
		dias = 30
	dias = max(7, min(dias, 365))

	hoy = timezone.localdate()
	desde = hoy - timedelta(days=dias - 1)
	desde_anterior = desde - timedelta(days=dias)
	hasta_anterior = desde - timedelta(days=1)

	base = Order.objects.filter(restaurante=profile.restaurante)
	periodo = base.filter(created_at__date__gte=desde, created_at__date__lte=hoy)
	anterior = base.filter(
		created_at__date__gte=desde_anterior,
		created_at__date__lte=hasta_anterior,
	)
	validos = periodo.exclude(estado=Order.CANCELADO)
	validos_anterior = anterior.exclude(estado=Order.CANCELADO)

	ventas = validos.aggregate(total=Sum("total"))["total"] or Decimal("0.00")
	ventas_anterior = (
		validos_anterior.aggregate(total=Sum("total"))["total"] or Decimal("0.00")
	)
	pedidos = validos.count()
	pedidos_anterior = validos_anterior.count()
	ticket = (ventas / pedidos) if pedidos else Decimal("0.00")
	ticket_anterior = (
		(ventas_anterior / pedidos_anterior) if pedidos_anterior else Decimal("0.00")
	)
	cancelados = periodo.filter(estado=Order.CANCELADO).count()
	clientes = validos.values("user_id").distinct().count()
	activos = base.filter(
		estado__in=[
			Order.PENDIENTE,
			Order.CONFIRMADO,
			Order.PREPARANDO,
			Order.EN_CAMINO,
		]
	).count()
	total_con_cancelados = pedidos + cancelados

	por_dia = {
		row["dia"]: row
		for row in validos.annotate(dia=TruncDate("created_at"))
		.values("dia")
		.annotate(ventas=Sum("total"), pedidos=Count("id"))
	}
	ventas_diarias = []
	for offset in range(dias):
		fecha = desde + timedelta(days=offset)
		row = por_dia.get(fecha)
		ventas_diarias.append(
			{
				"fecha": fecha.isoformat(),
				"ventas": round(float(row["ventas"]), 2) if row else 0.0,
				"pedidos": row["pedidos"] if row else 0,
			}
		)

	etiquetas_estado = dict(Order.ESTADO_CHOICES)
	conteo_estados = {
		row["estado"]: row["total"]
		for row in periodo.values("estado").annotate(total=Count("id"))
	}
	estados = [
		{
			"estado": valor,
			"label": etiqueta,
			"total": conteo_estados.get(valor, 0),
		}
		for valor, etiqueta in Order.ESTADO_CHOICES
	]

	items = OrderItem.objects.filter(
		order__restaurante=profile.restaurante,
		order__created_at__date__gte=desde,
		order__created_at__date__lte=hoy,
	).exclude(order__estado=Order.CANCELADO)

	importe = Sum(
		F("precio_unitario") * F("cantidad"),
		output_field=DecimalField(max_digits=12, decimal_places=2),
	)

	top_platillos = [
		{
			"nombre": row["nombre"],
			"unidades": row["unidades"],
			"ingresos": round(float(row["ingresos"] or 0), 2),
		}
		for row in items.values("nombre")
		.annotate(unidades=Sum("cantidad"), ingresos=importe)
		.order_by("-unidades", "-ingresos")[:6]
	]

	categorias = [
		{
			"nombre": row["dish__categoria__nombre"] or "Sin categoría",
			"unidades": row["unidades"],
			"total": round(float(row["total"] or 0), 2),
		}
		for row in items.filter(dish__isnull=False)
		.values("dish__categoria__nombre")
		.annotate(unidades=Sum("cantidad"), total=importe)
		.order_by("-total")[:6]
	]

	metodos_pago = [
		{
			"metodo": row["metodo_pago_resumen"] or "Pago contra entrega",
			"pedidos": row["pedidos"],
			"total": round(float(row["total"] or 0), 2),
		}
		for row in validos.values("metodo_pago_resumen")
		.annotate(total=Sum("total"), pedidos=Count("id"))
		.order_by("-total")[:6]
	]

	conteo_horas = {
		row["hora"]: row["pedidos"]
		for row in validos.annotate(hora=ExtractHour("created_at"))
		.values("hora")
		.annotate(pedidos=Count("id"))
	}
	por_hora = [
		{"hora": hora, "pedidos": conteo_horas.get(hora, 0)} for hora in range(24)
	]

	pedidos_recientes = [
		{
			"id": str(order.id),
			"numero": order.numero,
			"cliente": order.user.get_full_name() or order.user.username,
			"total": round(float(order.total), 2),
			"estado": order.estado,
			"estado_label": order.get_estado_display(),
			"items": order.items_count,
			"created_at": order.created_at.isoformat(),
		}
		for order in base.select_related("user")
		.annotate(items_count=Count("items"))
		.order_by("-created_at")[:6]
	]

	stock_bajo = [
		{
			"id": dish.id,
			"nombre": dish.nombre,
			"stock": dish.stock,
			"is_active": dish.is_active,
		}
		for dish in Dish.objects.filter(
			restaurante=profile.restaurante, stock__lte=5
		).order_by("stock", "nombre")[:6]
	]

	return Response(
		{
			"periodo": {
				"dias": dias,
				"desde": desde.isoformat(),
				"hasta": hoy.isoformat(),
			},
			"resumen": {
				"ventas": round(float(ventas), 2),
				"ventas_anterior": round(float(ventas_anterior), 2),
				"pedidos": pedidos,
				"pedidos_anterior": pedidos_anterior,
				"ticket_promedio": round(float(ticket), 2),
				"ticket_anterior": round(float(ticket_anterior), 2),
				"cancelados": cancelados,
				"clientes": clientes,
				"activos": activos,
				"tasa_cancelacion": (
					round((cancelados / total_con_cancelados) * 100, 1)
					if total_con_cancelados
					else 0.0
				),
			},
			"ventas_diarias": ventas_diarias,
			"estados": estados,
			"top_platillos": top_platillos,
			"categorias": categorias,
			"metodos_pago": metodos_pago,
			"por_hora": por_hora,
			"pedidos_recientes": pedidos_recientes,
			"stock_bajo": stock_bajo,
		}
	)
