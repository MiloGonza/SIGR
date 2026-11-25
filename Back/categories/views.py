from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from users.permissions import get_admin_profile

from .models import Category
from .serializers import AdminCategorySerializer, CategorySerializer


def admin_required_response(request):
	if get_admin_profile(request.user):
		return None
	return Response(
		{"detail": "Solo el administrador de un restaurante puede gestionar categorías."},
		status=status.HTTP_403_FORBIDDEN,
	)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_categories(request):
	categories = Category.objects.filter(is_active=True)
	serializer = CategorySerializer(categories, many=True)
	return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def admin_categories(request):
	"""Lista todas las categorías o crea una nueva (solo administrador)."""
	denied = admin_required_response(request)
	if denied:
		return denied

	if request.method == "GET":
		categories = Category.objects.annotate(
			platillos_count=Count("platillos")
		).order_by("orden", "nombre")
		return Response(
			AdminCategorySerializer(categories, many=True).data
		)

	serializer = AdminCategorySerializer(data=request.data)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_category_detail(request, pk):
	"""Renombra o elimina una categoría (solo administrador)."""
	denied = admin_required_response(request)
	if denied:
		return denied

	category = get_object_or_404(
		Category.objects.annotate(platillos_count=Count("platillos")), pk=pk
	)

	if request.method == "DELETE":
		category.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

	serializer = AdminCategorySerializer(
		category, data=request.data, partial=True
	)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
