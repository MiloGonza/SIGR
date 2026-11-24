from django.urls import path

from . import views

urlpatterns = [
	path("", views.payment_methods, name="payment-method-list"),
	path(
		"<int:pk>/",
		views.payment_method_detail,
		name="payment-method-detail",
	),
]
