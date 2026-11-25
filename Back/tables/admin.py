from django.contrib import admin

from .models import Table


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
	list_display = ["nombre", "restaurante", "capacidad", "esta_disponible"]
	list_filter = ["esta_disponible", "restaurante"]
	search_fields = ["nombre"]
