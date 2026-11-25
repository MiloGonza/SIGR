"""
URL configuration for config project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('restaurants/', include('restaurants.urls')),
    path('categories/', include('categories.urls')),
    path('users/', include('users.urls')),
    path('orders/', include('orders.urls')),
    path('carts/', include('carts.urls')),
    path('payment-methods/', include('payment_methods.urls')),
    path('reservations/', include('reservations.urls')),
    path('shifts/', include('shifts.urls')),
    path('tables/', include('tables.urls')),
    path('health/', views.health, name='health'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
