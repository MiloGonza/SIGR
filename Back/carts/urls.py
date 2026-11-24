from django.urls import path

from . import views

urlpatterns = [
	path("", views.cart_detail, name="cart-detail"),
	path("items/", views.add_cart_item, name="cart-item-add"),
	path("items/<int:pk>/", views.cart_item_detail, name="cart-item-detail"),
]
