from django.urls import path

from . import views

urlpatterns = [
	path("", views.orders, name="order-list"),
	path("staff/", views.staff_orders, name="staff-order-list"),
	path("stats/", views.restaurant_stats, name="restaurant-stats"),
	path("<uuid:pk>/", views.order_detail, name="order-detail"),
	path("<uuid:pk>/status/", views.update_order_status, name="order-status"),
]
