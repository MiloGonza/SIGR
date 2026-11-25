from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from users.permissions import get_admin_profile, get_staff_profile

from .models import Dish, Notification, Restaurant
from .serializers import (
	AdminDishSerializer,
	DishSerializer,
	RestaurantSerializer,
	StaffDishSerializer,
	StaffDishUpdateSerializer,
	StaffNotificationSerializer,
)


class RestaurantCursorPagination(CursorPagination):
	page_size = 100
	ordering = "-pk"


def admin_required_response(request):
	if get_admin_profile(request.user):
		return None
	return Response(
		{"detail": "Solo el administrador de un restaurante puede gestionar el menú."},
		status=status.HTTP_403_FORBIDDEN,
	)


def staff_required_response(request):
	if get_staff_profile(request.user):
		return None
	return Response(
		{"detail": "Solo el personal de un restaurante puede consultar la disponibilidad."},
		status=status.HTTP_403_FORBIDDEN,
	)


NOTIFICATION_RETENTION_DAYS = 30
NOTIFICATION_LIMIT = 100


def prune_notifications(restaurante):
	"""Elimina avisos vencidos y conserva solo los 100 más recientes."""
	cutoff = timezone.now() - timedelta(days=NOTIFICATION_RETENTION_DAYS)
	Notification.objects.filter(
		restaurante=restaurante, created_at__lt=cutoff
	).delete()
	keep = list(
		Notification.objects.filter(restaurante=restaurante)
		.order_by("-created_at", "-id")
		.values_list("id", flat=True)[:NOTIFICATION_LIMIT]
	)
	Notification.objects.filter(restaurante=restaurante).exclude(
		pk__in=keep
	).delete()


def create_availability_notification(user, dish, old_stock, old_active):
	"""Registra un aviso por cada cambio de disponibilidad o de stock."""
	actor_name = user.get_full_name().strip() or user.username

	if old_active and not dish.is_active:
		tipo = Notification.NO_DISPONIBLE
		mensaje = f"{actor_name} marcó {dish.nombre} como no disponible."
	elif not old_active and dish.is_active:
		tipo = Notification.DISPONIBLE
		mensaje = f"{actor_name} marcó {dish.nombre} como disponible."
	elif old_stock != dish.stock and dish.stock == 0:
		tipo = Notification.AGOTADO
		mensaje = f"{actor_name} dejó {dish.nombre} sin unidades."
	elif old_stock != dish.stock:
		tipo = Notification.STOCK
		mensaje = (
			f"{actor_name} cambió el stock de {dish.nombre}: "
			f"{old_stock} → {dish.stock}."
		)
	else:
		return None

	notification = Notification.objects.create(
		restaurante=dish.restaurante,
		dish=dish,
		actor=user,
		tipo=tipo,
		mensaje=mensaje,
	)
	prune_notifications(dish.restaurante)
	return notification


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def staff_notifications(request):
	"""Avisos recientes del restaurante del empleado o administrador."""
	denied = staff_required_response(request)
	if denied:
		return denied
	profile = get_staff_profile(request.user)
	prune_notifications(profile.restaurante)
	notifications = (
		Notification.objects.filter(restaurante=profile.restaurante)
		.select_related("actor", "dish")
		.order_by("-created_at", "-id")[:NOTIFICATION_LIMIT]
	)
	return Response(StaffNotificationSerializer(notifications, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_restaurant(request):
	serializer = RestaurantSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_restaurants(request):
	"""Listado público de tiendas. Acepta ?search= y ?categoria=."""
	restaurants = Restaurant.objects.filter(is_active=True)

	search = (request.query_params.get("search") or "").strip()
	if search:
		restaurants = restaurants.filter(
			Q(nombre__icontains=search)
			| Q(tipo__icontains=search)
			| Q(descripcion__icontains=search)
		)

	categoria = (request.query_params.get("categoria") or "").strip()
	if categoria and categoria.lower() != "todos":
		restaurants = restaurants.filter(
			Q(tags__contains=[categoria])
			| Q(platillos__categoria__slug=categoria)
		).distinct()

	paginator = RestaurantCursorPagination()
	page = paginator.paginate_queryset(restaurants, request)
	serializer = RestaurantSerializer(page, many=True, context={"request": request})
	return paginator.get_paginated_response(serializer.data)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_restaurant(request, pk):
	restaurant = get_object_or_404(Restaurant, pk=pk)
	serializer = RestaurantSerializer(
		restaurant,
		data=request.data,
		partial=request.method == "PATCH",
	)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_200_OK)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_restaurant(request, pk):
	restaurant = get_object_or_404(Restaurant, pk=pk)
	restaurant.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_dishes(request):
	"""Catálogo público de platillos. Filtros: restaurante, categoria, search."""
	dishes = Dish.objects.filter(is_active=True).select_related(
		"restaurante", "categoria"
	)

	restaurante = (request.query_params.get("restaurante") or "").strip()
	if restaurante:
		dishes = dishes.filter(restaurante_id=restaurante)

	categoria = (request.query_params.get("categoria") or "").strip()
	if categoria and categoria.lower() != "todos":
		dishes = dishes.filter(
			Q(categoria__slug=categoria) | Q(categoria__nombre__iexact=categoria)
		)

	search = (request.query_params.get("search") or "").strip()
	if search:
		dishes = dishes.filter(
			Q(nombre__icontains=search)
			| Q(descripcion__icontains=search)
			| Q(etiqueta__icontains=search)
			| Q(restaurante__nombre__icontains=search)
		)

	serializer = DishSerializer(dishes, many=True, context={"request": request})
	return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_restaurant_menu(request, pk):
	restaurant = get_object_or_404(Restaurant, pk=pk, is_active=True)
	dishes = restaurant.platillos.filter(is_active=True).select_related("categoria")
	serializer = DishSerializer(dishes, many=True, context={"request": request})
	return Response(
		{
			"restaurante": RestaurantSerializer(
				restaurant, context={"request": request}
			).data,
			"platillos": serializer.data,
		}
	)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def recipes(request):
	"""Listar o crear recetas/platillos del restaurante del administrador."""
	denied = admin_required_response(request)
	if denied:
		return denied
	profile = get_admin_profile(request.user)
	queryset = Dish.objects.filter(restaurante=profile.restaurante).select_related(
		"categoria"
	)

	if request.method == "GET":
		serializer = AdminDishSerializer(
			queryset, many=True, context={"request": request}
		)
		return Response(serializer.data)

	serializer = AdminDishSerializer(
		data=request.data, context={"request": request}
	)
	if serializer.is_valid():
		serializer.save(restaurante=profile.restaurante)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def recipe_detail(request, pk):
	denied = admin_required_response(request)
	if denied:
		return denied
	profile = get_admin_profile(request.user)
	recipe = get_object_or_404(Dish, pk=pk, restaurante=profile.restaurante)

	if request.method == "GET":
		return Response(
			AdminDishSerializer(recipe, context={"request": request}).data
		)
	if request.method == "DELETE":
		recipe.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

	serializer = AdminDishSerializer(
		recipe, data=request.data, partial=True, context={"request": request}
	)
	if serializer.is_valid():
		old_stock = recipe.stock
		old_active = recipe.is_active
		with transaction.atomic():
			serializer.save()
			create_availability_notification(
				request.user, recipe, old_stock, old_active
			)
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def staff_availability(request):
	"""Platillos de la tienda del empleado, incluidos los no disponibles."""
	denied = staff_required_response(request)
	if denied:
		return denied
	profile = get_staff_profile(request.user)
	dishes = (
		Dish.objects.filter(restaurante=profile.restaurante)
		.select_related("categoria")
		.order_by("categoria__orden", "nombre")
	)
	serializer = StaffDishSerializer(
		dishes, many=True, context={"request": request}
	)
	return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def staff_availability_detail(request, pk):
	"""Actualiza stock o disponibilidad de un platillo de la propia tienda."""
	denied = staff_required_response(request)
	if denied:
		return denied
	profile = get_staff_profile(request.user)
	dish = get_object_or_404(
		Dish, pk=pk, restaurante=profile.restaurante
	)

	serializer = StaffDishUpdateSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	old_stock = dish.stock
	old_active = dish.is_active
	with transaction.atomic():
		for field, value in serializer.validated_data.items():
			setattr(dish, field, value)
		dish.save(update_fields=list(serializer.validated_data.keys()))
		create_availability_notification(
			request.user, dish, old_stock, old_active
		)

	return Response(
		StaffDishSerializer(dish, context={"request": request}).data
	)




