from django.urls import path

from . import views

urlpatterns = [
	path("", views.get_restaurants, name="restaurant-list"),
	path("create/", views.create_restaurant, name="restaurant-create"),
	path("update/", views.update_restaurant, name="restaurant-create"),
	path("delete/", views.delete_restaurant, name="restaurant-create"),
]
