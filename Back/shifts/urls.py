from django.urls import path

from . import views

urlpatterns = [
	path("", views.shifts, name="shift-list"),
	path("<uuid:pk>/", views.shift_detail, name="shift-detail"),
]
