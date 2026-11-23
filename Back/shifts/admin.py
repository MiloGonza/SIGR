from django.contrib import admin

from .models import Shift


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
	list_display = (
		"fecha",
		"empleado",
		"restaurante",
		"hora_inicio",
		"hora_fin",
		"tipo",
		"estado",
	)
	list_filter = ("tipo", "estado", "restaurante")
	search_fields = (
		"empleado__username",
		"empleado__email",
		"restaurante__nombre",
	)
	ordering = ("-fecha", "hora_inicio")
