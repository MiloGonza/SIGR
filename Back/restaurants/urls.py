from django.urls import path

from . import views

urlpatterns = [
	path("", views.get_restaurants, name="restaurant-list"),
	path("categories/", views.get_categories, name="category-list"),
	path("dishes/", views.get_dishes, name="dish-list"),
	path("recipes/", views.recipes, name="recipe-list"),
	path("recipes/<int:pk>/", views.recipe_detail, name="recipe-detail"),
	path("<uuid:pk>/menu/", views.get_restaurant_menu, name="restaurant-menu"),
	path("create/", views.create_restaurant, name="restaurant-create"),
	path("update/<uuid:pk>/", views.update_restaurant, name="restaurant-update"),
	path("delete/<uuid:pk>/", views.delete_restaurant, name="restaurant-delete"),
]
