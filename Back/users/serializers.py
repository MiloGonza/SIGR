from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework.pagination import CursorPagination

from .models import Address, PaymentMethod, Profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
	password = serializers.CharField(
		write_only=True,
		required=False,
		min_length=8,
		error_messages={
			"min_length": "La contraseña debe tener al menos 8 caracteres",
			"blank": "La contraseña no puede estar vacía",
		},
	)
	rol = serializers.SerializerMethodField()
	# Campo declarado explícitamente para no heredar UnicodeUsernameValidator
	# del modelo (no permite espacios). La unicidad se valida abajo.
	username = serializers.CharField(
		max_length=150,
		min_length=3,
		error_messages={
			"required": "El nombre de usuario es obligatorio",
			"blank": "El nombre de usuario no puede estar vacío",
			"min_length": "El nombre de usuario debe tener al menos 3 caracteres",
			"max_length": "El nombre de usuario no puede superar los 150 caracteres",
		},
	)

	class Meta:
		model = User
		fields = ("id", "username", "email", "rol", "password")
		extra_kwargs = {
			"email": {
				"required": True,
				"error_messages": {
					"required": "El correo es obligatorio",
					"blank": "El correo no puede estar vacío",
				},
			},
		}

	def validate(self, attrs):
		# En creación la contraseña es obligatoria; en actualización es opcional.
		if self.instance is None and not attrs.get("password"):
			raise serializers.ValidationError({"password": "La contraseña es obligatoria"})
		return attrs

	def get_rol(self, obj):
		profile = getattr(obj, "profile", None)
		return profile.rol if profile else Profile.CLIENTE

	def validate_email(self, value):
		value = value.strip().lower()
		users = User.objects.filter(email__iexact=value)
		if self.instance is not None:
			users = users.exclude(pk=self.instance.pk)
		if users.exists():
			raise serializers.ValidationError("Ya existe un usuario con este correo")
		return value

	def validate_username(self, value):
		# Permite espacios internos y normaliza los repetidos.
		value = " ".join(value.split())
		users = User.objects.filter(username__iexact=value)
		if self.instance is not None:
			users = users.exclude(pk=self.instance.pk)
		if users.exists():
			raise serializers.ValidationError("Ya existe un usuario con este nombre")
		return value

	def create(self, validated_data):
		password = validated_data.pop("password")
		user = User(**validated_data)
		user.set_password(password)
		user.save()
		return user

	def update(self, instance, validated_data):
		password = validated_data.pop("password", None)
		for field, value in validated_data.items():
			setattr(instance, field, value)
		if password:
			instance.set_password(password)
		instance.save()
		return instance


class EmployeeSerializer(UserSerializer):
	"""Usuario del equipo de un restaurante.

	El rol no se toma del cuerpo: la vista lo valida y lo asigna en el perfil
	para que un administrador no pueda crear clientes desde este endpoint.
	"""

	class Meta(UserSerializer.Meta):
		fields = (
			"id",
			"username",
			"email",
			"rol",
			"password",
			"is_active",
			"date_joined",
			"last_login",
		)
		read_only_fields = ("id", "rol", "date_joined", "last_login")


class UserCursorPagination(CursorPagination):
	page_size = 100
	ordering = "-pk"


class AddressSerializer(serializers.ModelSerializer):
	class Meta:
		model = Address
		fields = [
			"id",
			"alias",
			"direccion",
			"ciudad",
			"notas",
			"is_default",
			"created_at",
		]
		read_only_fields = ["id", "created_at"]

	def create(self, validated_data):
		if not Address.objects.filter(user=validated_data["user"]).exists():
			validated_data["is_default"] = True
		return super().create(validated_data)


def detect_card_brand(number):
	if number.startswith("4"):
		return "Visa"
	if number[:2] in {"51", "52", "53", "54", "55"}:
		return "Mastercard"
	if number.startswith(("34", "37")):
		return "American Express"
	if number[:2] in {"36", "38", "39"}:
		return "Diners Club"
	return "Tarjeta"


def luhn_is_valid(number):
	total = 0
	for index, digit in enumerate(reversed(number)):
		value = int(digit)
		if index % 2 == 1:
			value *= 2
			if value > 9:
				value -= 9
		total += value
	return total % 10 == 0


class PaymentMethodSerializer(serializers.ModelSerializer):
	# El número completo solo se acepta al crear/actualizar y nunca se guarda.
	numero_tarjeta = serializers.CharField(
		write_only=True, required=False, allow_blank=True, max_length=25
	)

	class Meta:
		model = PaymentMethod
		fields = [
			"id",
			"tipo",
			"alias",
			"titular",
			"marca",
			"ultimos4",
			"mes_expira",
			"anio_expira",
			"is_default",
			"created_at",
			"numero_tarjeta",
		]
		read_only_fields = ["id", "marca", "ultimos4", "created_at"]

	def validate(self, attrs):
		tipo = attrs.get("tipo", getattr(self.instance, "tipo", PaymentMethod.TARJETA))
		numero = str(attrs.get("numero_tarjeta") or "").replace(" ", "").replace("-", "")
		if not numero:
			attrs.pop("numero_tarjeta", None)

		if tipo == PaymentMethod.TARJETA:
			if numero:
				if not numero.isdigit() or not 13 <= len(numero) <= 19:
					raise serializers.ValidationError(
						{"numero_tarjeta": "El número de tarjeta no es válido."}
					)
				if not luhn_is_valid(numero):
					raise serializers.ValidationError(
						{"numero_tarjeta": "El número de tarjeta no es válido."}
					)
				attrs["ultimos4"] = numero[-4:]
				attrs["marca"] = detect_card_brand(numero)
			elif self.instance is None and not attrs.get("ultimos4"):
				raise serializers.ValidationError(
					{"numero_tarjeta": "Ingresa el número de la tarjeta."}
				)

		mes = attrs.get("mes_expira", getattr(self.instance, "mes_expira", None))
		anio = attrs.get("anio_expira", getattr(self.instance, "anio_expira", None))
		if (mes and not anio) or (anio and not mes):
			raise serializers.ValidationError(
				{"mes_expira": "Indica el mes y el año de vencimiento."}
			)
		if mes is not None and not 1 <= int(mes) <= 12:
			raise serializers.ValidationError(
				{"mes_expira": "El mes debe estar entre 1 y 12."}
			)
		if mes and anio:
			hoy = timezone.localdate()
			if int(anio) < hoy.year or (
				int(anio) == hoy.year and int(mes) < hoy.month
			):
				raise serializers.ValidationError(
					{"anio_expira": "La tarjeta ya está vencida."}
				)

		if numero:
			attrs["numero_tarjeta"] = numero
		return attrs

	def create(self, validated_data):
		validated_data.pop("numero_tarjeta", None)
		if not PaymentMethod.objects.filter(user=validated_data["user"]).exists():
			validated_data["is_default"] = True
		return super().create(validated_data)

	def update(self, instance, validated_data):
		validated_data.pop("numero_tarjeta", None)
		return super().update(instance, validated_data)
