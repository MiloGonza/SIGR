from rest_framework import serializers

from .models import Table


class TableSerializer(serializers.ModelSerializer):
	class Meta:
		model = Table
		fields = [
			"id",
			"restaurante",
			"nombre",
			"capacidad",
			"esta_disponible",
			"created_at",
			"updated_at",
		]
		read_only_fields = ["id", "restaurante", "created_at", "updated_at"]
