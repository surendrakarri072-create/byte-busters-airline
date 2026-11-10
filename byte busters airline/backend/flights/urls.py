from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
router = DefaultRouter()
router.register("aircraft", views.AircraftViewSet, basename="aircraft")
router.register("flights", views.FlightViewSet, basename="flights")
router.register("passengers", views.PassengerViewSet, basename="passengers")
router.register("bookings", views.BookingViewSet, basename="bookings")
urlpatterns = [
    path("login/", views.login_view),
    path("change-password/", views.change_password),
    path("dashboard/", views.dashboard),
    path("reports/", views.reports),
    path("noshow/", views.noshow),
    path("", include(router.urls)),
]
