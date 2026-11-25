from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
	class Meta:
		model = Category
		fields = ["id", "nombre", "slug", "icon", "orden", "is_active"]
		read_only_fields = ["id"]


class AdminCategorySerializer(serializers.ModelSerializer):
	"""Categoría gestionada desde el panel: solo se edita el nombre."""

	platillos_count = serializers.IntegerField(read_only=True, default=0)

	class Meta:
		model = Category
		fields = ["id", "nombre", "platillos_count"]
		read_only_fields = ["id", "platillos_count"]
		extra_kwargs = {
			"nombre": {"validators": [], "allow_blank": True}
		}

	def validate_nombre(self, value):
		nombre = (value or "").strip()
		if not nombre:
			raise serializers.ValidationError("El nombre es obligatorio.")
		queryset = Category.objects.filter(nombre__iexact=nombre)
		if self.instance:
			queryset = queryset.exclude(pk=self.instance.pk)
		if queryset.exists():
			raise serializers.ValidationError(
				"Ya existe una categoría con ese nombre."
			)
		return nombre

	def create(self, validated_data):
		ultimo = (
			Category.objects.order_by("-orden")
			.values_list("orden", flat=True)
			.first()
		)
		validated_data["orden"] = (ultimo or 0) + 1
		return super().create(validated_data)
