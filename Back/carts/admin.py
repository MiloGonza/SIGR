from django.contrib import admin

from .models import Cart, CartItem


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
	list_display = ["user", "restaurante", "updated_at"]
	search_fields = ["user__username", "user__email"]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
	list_display = ["cart", "dish", "cantidad"]
	list_filter = ["dish__restaurante"]
