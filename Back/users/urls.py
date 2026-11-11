from django.urls import path

from . import views

urlpatterns = [
    path("", views.get_users, name="user-list"),
    path("create/", views.create_user, name="user-create"),
    path("update/<int:pk>/", views.update_user, name="user-update"),
    path("delete/<int:pk>/", views.delete_user, name="user-delete"),
    path("login/", views.login_user, name="user-login"),
]
