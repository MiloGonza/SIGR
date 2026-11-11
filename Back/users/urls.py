from django.urls import path

from . import views

urlpatterns = [
    path("", views.get_users, name="user-list"),
    path("create/", views.create_user, name="user-create"),
    path("update/", views.update_user, name="user-create"),
    path("delete/", views.delete_user, name="user-create"),
    path("login/", views.login_user, name="user-create"),

]
