from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.pagination import CursorPagination

from .models import Profile

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


class UserCursorPagination(CursorPagination):
	page_size = 100
	ordering = "-pk"
