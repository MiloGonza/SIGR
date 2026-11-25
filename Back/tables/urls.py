from django.urls import path

from . import views

urlpatterns = [
	path("", views.admin_tables, name="admin-tables"),
	path("<int:pk>/", views.admin_table_detail, name="admin-table-detail"),
]
