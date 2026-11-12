from django.urls import path

from . import views

urlpatterns = [
	path("cart/", views.cart_detail, name="cart-detail"),
	path("cart/items/", views.add_cart_item, name="cart-item-add"),
	path("cart/items/<int:pk>/", views.cart_item_detail, name="cart-item-detail"),
	path("", views.orders, name="order-list"),
	path("stats/", views.restaurant_stats, name="restaurant-stats"),
	path("<uuid:pk>/", views.order_detail, name="order-detail"),
	path("<uuid:pk>/status/", views.update_order_status, name="order-status"),
]
