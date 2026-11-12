from django.contrib import admin

from .models import Category, Dish, Restaurant


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
	list_display = [
		"nombre",
		"tipo",
		"rating",
		"delivery_min",
		"delivery_max",
		"free_shipping",
		"is_active",
	]
	list_filter = ["is_active", "free_shipping"]
	search_fields = ["nombre", "tipo", "descripcion"]
	prepopulated_fields = {"slug": ("nombre",)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ["nombre", "slug", "icon", "orden", "is_active"]
	list_filter = ["is_active"]
	prepopulated_fields = {"slug": ("nombre",)}


@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
	list_display = [
		"nombre",
		"restaurante",
		"categoria",
		"precio",
		"rating",
		"prep_minutes",
		"is_active",
	]
	list_filter = ["is_active", "restaurante", "categoria"]
	search_fields = ["nombre", "descripcion", "etiqueta"]
