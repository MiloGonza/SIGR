from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import Address, PaymentMethod, Profile
from .serializers import (
	AddressSerializer,
	EmployeeSerializer,
	PaymentMethodSerializer,
	UserCursorPagination,
	UserSerializer,
)
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


# Roles que un administrador puede asignar dentro de su propio restaurante.
EMPLOYEE_ROLES = (Profile.MESERO, Profile.ADMINISTRADOR)


def get_admin_profile(user):
	profile = getattr(user, "profile", None)
	if profile and profile.rol == Profile.ADMINISTRADOR and profile.restaurante_id:
		return profile
	return None


def parse_employee_role(value):
	role = ROLE_ALIASES.get(str(value or Profile.MESERO).strip().lower())
	return role if role in EMPLOYEE_ROLES else None


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


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def employees(request):
	"""Listar o crear empleados del restaurante que administra el usuario."""
	admin = get_admin_profile(request.user)
	if admin is None:
		return Response(
			{
				"detail": (
					"Solo un administrador con restaurante asociado puede "
					"gestionar empleados."
				)
			},
			status=status.HTTP_403_FORBIDDEN,
		)

	if request.method == "GET":
		team = (
			User.objects.filter(
				profile__restaurante_id=admin.restaurante_id,
				profile__rol__in=EMPLOYEE_ROLES,
			)
			.select_related("profile")
			.order_by("username")
		)
		return Response(EmployeeSerializer(team, many=True).data)

	rol = parse_employee_role(request.data.get("rol"))
	if rol is None:
		return Response(
			{"rol": ["El rol debe ser mesero o administrador."]},
			status=status.HTTP_400_BAD_REQUEST,
		)

	data = request.data.copy()
	data.pop("rol", None)
	data.pop("role", None)
	serializer = EmployeeSerializer(data=data)
	if serializer.is_valid():
		user = serializer.save()
		Profile.objects.update_or_create(
			user=user,
			defaults={"rol": rol, "restaurante": admin.restaurante},
		)
		return Response(
			EmployeeSerializer(user).data,
			status=status.HTTP_201_CREATED,
		)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def employee_detail(request, pk):
	"""Consultar, editar o eliminar un empleado del restaurante del admin."""
	admin = get_admin_profile(request.user)
	if admin is None:
		return Response(
			{
				"detail": (
					"Solo un administrador con restaurante asociado puede "
					"gestionar empleados."
				)
			},
			status=status.HTTP_403_FORBIDDEN,
		)

	profile = get_object_or_404(
		Profile.objects.select_related("user"),
		user_id=pk,
		restaurante_id=admin.restaurante_id,
		rol__in=EMPLOYEE_ROLES,
	)
	employee = profile.user

	if request.method == "GET":
		return Response(EmployeeSerializer(employee).data)

	if request.method == "DELETE":
		if employee.pk == request.user.pk:
			return Response(
				{"detail": "No puedes eliminar tu propio perfil."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		employee.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

	rol = None
	if "rol" in request.data or "role" in request.data:
		rol = parse_employee_role(
			request.data.get("rol") or request.data.get("role")
		)
		if rol is None:
			return Response(
				{"rol": ["El rol debe ser mesero o administrador."]},
				status=status.HTTP_400_BAD_REQUEST,
			)

	if (
		employee.pk == request.user.pk
		and rol is not None
		and rol != Profile.ADMINISTRADOR
	):
		return Response(
			{"rol": ["No puedes cambiar tu propio rol de administrador."]},
			status=status.HTTP_400_BAD_REQUEST,
		)

	if employee.pk == request.user.pk and request.data.get("is_active") is False:
		return Response(
			{"is_active": ["No puedes desactivar tu propio perfil."]},
			status=status.HTTP_400_BAD_REQUEST,
		)

	data = request.data.copy()
	data.pop("rol", None)
	data.pop("role", None)
	serializer = EmployeeSerializer(employee, data=data, partial=True)
	if serializer.is_valid():
		serializer.save()
		if rol is not None:
			profile.rol = rol
			profile.save(update_fields=["rol"])
		return Response(EmployeeSerializer(employee).data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def addresses(request):
	"""Listar o crear direcciones del usuario autenticado."""
	if request.method == "GET":
		queryset = Address.objects.filter(user=request.user)
		return Response(AddressSerializer(queryset, many=True).data)

	serializer = AddressSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save(user=request.user)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def address_detail(request, pk):
	address = get_object_or_404(Address, pk=pk, user=request.user)
	if request.method == "GET":
		return Response(AddressSerializer(address).data)
	if request.method == "DELETE":
		address.delete()
		if not Address.objects.filter(user=request.user, is_default=True).exists():
			next_address = Address.objects.filter(user=request.user).first()
			if next_address:
				next_address.is_default = True
				next_address.save(update_fields=["is_default"])
		return Response(status=status.HTTP_204_NO_CONTENT)

	serializer = AddressSerializer(address, data=request.data, partial=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

