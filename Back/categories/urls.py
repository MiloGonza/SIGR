from django.urls import path

from . import views

urlpatterns = [
	path("", views.get_categories, name="category-list"),
	path("manage/", views.admin_categories, name="admin-category-list"),
	path(
		"manage/<int:pk>/",
		views.admin_category_detail,
		name="admin-category-detail",
	),
]
