from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
	model = OrderItem
	extra = 0
	readonly_fields = ["subtotal"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = [
		"numero",
		"user",
		"restaurante",
		"estado",
		"total",
		"created_at",
	]
	list_filter = ["estado", "restaurante", "created_at"]
	search_fields = ["numero", "user__username", "user__email"]
	readonly_fields = ["numero", "created_at", "updated_at"]
	inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
	list_display = ["order", "nombre", "cantidad", "precio_unitario"]
