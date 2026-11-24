from django.contrib import admin

from .models import PaymentMethod


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
	list_display = ["alias", "user", "tipo", "marca", "ultimos4", "is_default"]
	list_filter = ["tipo", "is_default"]
	search_fields = ["alias", "titular", "user__username"]
