from django.contrib import admin

from .models import Address, PaymentMethod, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ["user", "rol", "restaurante"]
	list_filter = ["rol", "restaurante"]
	search_fields = ["user__username", "user__email"]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
	list_display = ["alias", "user", "direccion", "ciudad", "is_default"]
	list_filter = ["is_default", "ciudad"]
	search_fields = ["alias", "direccion", "user__username"]


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
	list_display = ["alias", "user", "tipo", "marca", "ultimos4", "is_default"]
	list_filter = ["tipo", "is_default"]
	search_fields = ["alias", "titular", "user__username"]
