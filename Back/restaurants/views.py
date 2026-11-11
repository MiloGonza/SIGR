from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.pagination import CursorPagination
from rest_framework.response import Response

from .models import Restaurant
from .serializers import RestaurantSerializer


class RestaurantCursorPagination(CursorPagination):
	page_size = 100
	ordering = "-pk"


@api_view(["POST"])
def create_restaurant(request):
	serializer = RestaurantSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_restaurants(request):
	paginator = RestaurantCursorPagination()
	restaurants = paginator.paginate_queryset(Restaurant.objects.all(), request)
	serializer = RestaurantSerializer(restaurants, many=True)
	return paginator.get_paginated_response(serializer.data)


@api_view(["PUT", "PATCH"])
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
def delete_restaurant(request, pk):
	restaurant = get_object_or_404(Restaurant, pk=pk)
	restaurant.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)
