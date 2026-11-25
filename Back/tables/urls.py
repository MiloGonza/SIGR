from django.urls import path

from . import views

urlpatterns = [
	path("", views.admin_tables, name="admin-tables"),
	path("public/", views.public_tables, name="public-tables"),
	path("staff/", views.staff_tables, name="staff-tables"),
	path("<uuid:pk>/", views.admin_table_detail, name="admin-table-detail"),
]
