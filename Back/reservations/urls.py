from django.urls import path

from . import views

urlpatterns = [
	path("", views.table_reservations, name="table-reservation-list"),
	path(
		"<uuid:pk>/",
		views.table_reservation_detail,
		name="table-reservation-detail",
	),
	path(
		"<uuid:pk>/cancel/",
		views.cancel_table_reservation,
		name="table-reservation-cancel",
	),
	path(
		"<uuid:pk>/accept/",
		views.accept_table_reservation,
		name="table-reservation-accept",
	),
]
