from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .serializers import UserCursorPagination, UserSerializer
from restaurants.models import Restaurant

User = get_user_model()


@api_view(["POST"])
def create_user(request):
	"""Crear usuario. POST /create/; body: campos de UserSerializer.
	Devuelve 201 y el usuario creado, o 400 con errores de validación.
	"""
	data = request.data.copy()
	role = data.pop("rol", None)
	if role is None:
		role = data.pop("role", None)
	local_name = data.pop("Nombre del local", None)
	if local_name is None:
		local_name = data.pop("nombre_local", None)
	if local_name is None:
		local_name = data.pop("nombre del local", None)
	is_admin = str(role).strip().lower() in ("administrador", "admin")
	if is_admin and not local_name:
		return Response(
			{"Nombre del local": ["Este campo es requerido para administradores."]},
			status=status.HTTP_400_BAD_REQUEST,
		)

	serializer = UserSerializer(data=data)
	if serializer.is_valid():
		serializer.save()
		if is_admin:
			Restaurant.objects.create(nombre=local_name)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def get_users(request):
	"""Listar usuarios. GET /; no requiere body.
	Devuelve resultados paginados según UserCursorPagination.
	"""
	paginator = UserCursorPagination()
	users = paginator.paginate_queryset(User.objects.all(), request)
	serializer = UserSerializer(users, many=True)
	return paginator.get_paginated_response(serializer.data)


@api_view(["PUT", "PATCH"])
def update_user(request, pk):
	"""Actualizar usuario. PUT /update/<pk>/ requiere todos los campos;
	PATCH /update/<pk>/ permite enviar solo los campos a cambiar. Body:
	campos de UserSerializer. Devuelve 200, 400 por validación o 404.
	La URL debe declarar pk (por ejemplo, <int:pk>).
	"""
	user = get_object_or_404(User, pk=pk)
	serializer = UserSerializer(
		user,
		data=request.data,
		partial=request.method == "PATCH",
	)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_200_OK)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
def delete_user(request, pk):
	"""Eliminar usuario. DELETE /delete/<pk>/; no requiere body.
	Devuelve 204 si se elimina o 404 si no existe. La URL debe declarar pk.
	"""
	user = get_object_or_404(User, pk=pk)
	user.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def login_user(request):
	"""Iniciar sesión. POST /login/ con JSON que incluya usuario o correo
	(también username/email) y contrasena (también password). Ejemplo:
	{"usuario": "ana", "contrasena": "secreto"}. Devuelve 200 con token,
	400 si faltan datos o 401 si las credenciales son inválidas.
	"""
	identifier = (
		request.data.get("usuario")
		or request.data.get("correo")
		or request.data.get("username")
		or request.data.get("email")
	)
	password = request.data.get("contrasena") or request.data.get("password")
	if not identifier or not password:
		return Response(
			{"detail": "Se requieren usuario/correo y contrasena."},
			status=status.HTTP_400_BAD_REQUEST,
		)

	username_field = User.USERNAME_FIELD
	if username_field != "email":
		user_by_email = User.objects.filter(email__iexact=identifier).first()
		if user_by_email:
			identifier = getattr(user_by_email, username_field)

	user = authenticate(request, **{username_field: identifier, "password": password})
	if user is None:
		return Response(
			{"detail": "Credenciales invalidas."},
			status=status.HTTP_401_UNAUTHORIZED,
		)

	token, _ = Token.objects.get_or_create(user=user)
	return Response({"token": token.key}, status=status.HTTP_200_OK)

