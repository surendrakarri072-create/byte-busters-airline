from django.contrib.auth.models import User   # Django's built-in User (hashed passwords)
from django.db import models
from django.db.models import Sum

ACTIVE = ["confirmed", "checked_in"]  # booking statuses that occupy a seat


class Aircraft(models.Model):
    name = models.CharField(max_length=50, unique=True)   # e.g. VT-A320
    model = models.CharField(max_length=50)               # e.g. Airbus A320
    total_seats = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} ({self.model})"


class Flight(models.Model):
    STATUS = [("scheduled", "Scheduled"), ("cancelled", "Cancelled"), ("departed", "Departed")]
    flight_number = models.CharField(max_length=10, unique=True)
    source = models.CharField(max_length=50)
    destination = models.CharField(max_length=50)
    date = models.DateField()
    departure_time = models.TimeField()
    arrival_time = models.TimeField()
    aircraft = models.ForeignKey(Aircraft, on_delete=models.PROTECT)
    safety_buffer = models.PositiveIntegerField(default=3)   # management can change this
    status = models.CharField(max_length=10, choices=STATUS, default="scheduled")

    def __str__(self):
        return self.flight_number


class Passenger(models.Model):
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    email = models.EmailField()

    def __str__(self):
        return self.name


class Booking(models.Model):
    STATUS = [("confirmed", "Confirmed"), ("cancelled", "Cancelled"), ("checked_in", "Checked-in"),
              ("no_show", "No-show"), ("bumped", "Bumped")]
    FARE = [("economy", "Economy"), ("premium", "Premium Economy"), ("business", "Business")]
    passenger = models.ForeignKey(Passenger, on_delete=models.CASCADE)
    flight = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name="bookings")
    seat_number = models.CharField(max_length=5, blank=True)
    fare_type = models.CharField(max_length=10, choices=FARE, default="economy")
    status = models.CharField(max_length=10, choices=STATUS, default="confirmed")
    created = models.DateTimeField(auto_now_add=True)

    @property
    def code(self):
        return f"BK{1000 + self.id}"   # human friendly Booking ID


class CheckIn(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)
    checked_in_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    time = models.DateTimeField(auto_now_add=True)


class NoShowData(models.Model):
    """Previous passenger records used to estimate the no-show rate."""
    route = models.CharField(max_length=50)
    total_passengers = models.PositiveIntegerField()
    no_shows = models.PositiveIntegerField()


def seat_label(n):
    return f"{n // 6 + 1}{'ABCDEF'[n % 6]}"


def noshow_rate():
    """No-show % = total previous no-shows / total previous passengers * 100"""
    t = NoShowData.objects.aggregate(p=Sum("total_passengers"), n=Sum("no_shows"))
    return round(t["n"] * 100 / t["p"], 2) if t["p"] else 0.0


def flight_stats(f, rate=None):
    """All overbooking numbers for one flight (the heart of the project)."""
    rate = noshow_rate() if rate is None else rate
    cap = f.aircraft.total_seats
    active = f.bookings.filter(status__in=ACTIVE).count()
    checked = f.bookings.filter(status="checked_in").count()
    expected_ns = round(active * rate / 100)          # e.g. 190 x 8 / 100 = 15.2 -> 15
    show_ups = active - expected_ns                   # 190 - 15 = 175
    limit = cap + expected_ns - f.safety_buffer       # 180 + 15 - 3 = 192
    if show_ups >= cap * 1.10:
        risk = "CRITICAL"
    elif show_ups > cap:
        risk = "HIGH"
    elif show_ups >= cap - 3 or active > limit:
        risk = "MODERATE"
    else:
        risk = "SAFE"
    return dict(capacity=cap, bookings=active, checked_in=checked, available_seats=max(0, cap - active),
                no_show_rate=rate, expected_no_shows=expected_ns, expected_show_ups=show_ups,
                safe_limit=limit, risk=risk)
