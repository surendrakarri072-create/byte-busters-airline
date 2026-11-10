from django.contrib import admin
from .models import *
for m in (Aircraft, Flight, Passenger, Booking, CheckIn, NoShowData):
    admin.site.register(m)
