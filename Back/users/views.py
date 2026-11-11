from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import Profile
from .serializers import UserCursorPagination, UserSerializer
from restaurants.models import Restaurant

User = get_user_model()

# Roles aceptados desde el frontend (incluye alias) y su valor canónico.
ROLE_ALIASES = {
	"cliente": Profile.CLIENTE,
	"mesero": Profile.MESERO,
	"empleado": Profile.MESERO,
	"administrador": Profile.ADMINISTRADOR,
	"admin": Profile.ADMINISTRADOR,
}

LOCAL_NAME_KEYS = ("Nombre del local", "nombreLocal", "nombre_local", "nombre del local")


def normalize_role(role):
	return ROLE_ALIASES.get(str(role or "").strip().lower(), Profile.CLIENTE)


@api_view(["POST"])
def create_user(request):
	"""Crear usuario. POST /create/; body: campos de UserSerializer.
	Devuelve 201 y el usuario creado, o 400 con errores de validación.
	"""
	data = request.data.copy()
	role = data.pop("rol", None)
	if role is None:
		role = data.pop("role", None)
	local_name = None
	for key in LOCAL_NAME_KEYS:
		if local_name is None:
			local_name = data.pop(key, None)
	rol = normalize_role(role)
	is_admin = rol == Profile.ADMINISTRADOR
	if is_admin and not local_name:
		return Response(
			{"Nombre del local": ["Este campo es requerido para administradores."]},
			status=status.HTTP_400_BAD_REQUEST,
		)

	serializer = UserSerializer(data=data)
	if serializer.is_valid():
		user = serializer.save()
		restaurant = Restaurant.objects.create(nombre=local_name) if is_admin else None
		Profile.objects.update_or_create(
			user=user,
			defaults={"rol": rol, "restaurante": restaurant},
		)
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
	identifier = str(identifier).strip() if identifier else ""
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
		# Permitir el nombre de usuario sin distinguir mayúsculas/minúsculas.
		user_match = User.objects.filter(**{f"{username_field}__iexact": identifier}).first()
		if user_match:
			user = authenticate(
				request,
				**{username_field: getattr(user_match, username_field), "password": password},
			)
	if user is None:
		return Response(
			{"detail": "Credenciales invalidas."},
			status=status.HTTP_401_UNAUTHORIZED,
		)

	token, _ = Token.objects.get_or_create(user=user)
	profile = getattr(user, "profile", None)
	return Response(
		{
			"token": token.key,
			"id": user.pk,
			"username": user.username,
			"email": user.email,
			"rol": profile.rol if profile else Profile.CLIENTE,
			"restaurante": (
				{"id": str(profile.restaurante_id), "nombre": profile.restaurante.nombre}
				if profile and profile.restaurante
				else None
			),
		},
		status=status.HTTP_200_OK,
	)

