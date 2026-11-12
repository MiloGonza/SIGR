from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Category, Dish, Restaurant
from .serializers import CategorySerializer, DishSerializer, RestaurantSerializer


class RestaurantCursorPagination(CursorPagination):
	page_size = 100
	ordering = "-pk"


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
def get_categories(request):
	categories = Category.objects.filter(is_active=True)
	serializer = CategorySerializer(categories, many=True)
	return Response(serializer.data)


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
