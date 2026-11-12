from django.urls import path

from . import views

urlpatterns = [
	path("", views.get_users, name="user-list"),
	path("create/", views.create_user, name="user-create"),
	path("update/<int:pk>/", views.update_user, name="user-update"),
	path("delete/<int:pk>/", views.delete_user, name="user-delete"),
	path("login/", views.login_user, name="user-login"),
	path("employees/", views.employees, name="employee-list"),
	path("employees/<int:pk>/", views.employee_detail, name="employee-detail"),
	path("addresses/", views.addresses, name="address-list"),
	path("addresses/<int:pk>/", views.address_detail, name="address-detail"),
	path("payment-methods/", views.payment_methods, name="payment-method-list"),
	path(
		"payment-methods/<int:pk>/",
		views.payment_method_detail,
		name="payment-method-detail",
	),
]
