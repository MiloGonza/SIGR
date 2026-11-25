from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PaymentMethod
from .serializers import PaymentMethodSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def payment_methods(request):
	"""Listar o crear métodos de pago del usuario autenticado."""
	if request.method == "GET":
		queryset = PaymentMethod.objects.filter(user=request.user)
		return Response(PaymentMethodSerializer(queryset, many=True).data)

	serializer = PaymentMethodSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save(user=request.user)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def payment_method_detail(request, pk):
	method = get_object_or_404(PaymentMethod, pk=pk, user=request.user)
	if request.method == "GET":
		return Response(PaymentMethodSerializer(method).data)
	if request.method == "DELETE":
		method.delete()
		if not PaymentMethod.objects.filter(
			user=request.user, is_default=True
		).exists():
			next_method = PaymentMethod.objects.filter(user=request.user).first()
			if next_method:
				next_method.is_default = True
				next_method.save(update_fields=["is_default"])
		return Response(status=status.HTTP_204_NO_CONTENT)

	serializer = PaymentMethodSerializer(method, data=request.data, partial=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
