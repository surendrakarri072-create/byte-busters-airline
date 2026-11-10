import random
from datetime import date, time, timedelta
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from flights.models import *


class Command(BaseCommand):
    help = "Create demo data (runs only once)"

    def handle(self, *args, **opts):
        if Flight.objects.exists():
            return
        random.seed(1)
        User.objects.create_user("management", "m@demo.com", "admin123", is_staff=True, is_superuser=True)
        User.objects.create_user("staff", "s@demo.com", "staff123")
        # NOTE: seat counts are small so 100+ bookings give a visible mix of risk levels
        planes = [Aircraft.objects.create(name=n, model=m, total_seats=s) for n, m, s in [
            ("VT-A320", "Airbus A320", 40), ("VT-B738", "Boeing 737-800", 36), ("VT-A321", "Airbus A321", 48),
            ("VT-AT72", "ATR 72", 30), ("VT-B789", "Boeing 787-9", 50)]]
        for r, p, n in [("DEL-BOM", 250, 22), ("HYD-DEL", 200, 14), ("BLR-MAA", 150, 12),
                        ("BOM-BLR", 200, 16), ("CCU-DEL", 200, 16)]:      # 1000 passengers, 80 no-shows = 8%
            NoShowData.objects.create(route=r, total_passengers=p, no_shows=n)
        first = ["Aarav", "Vivaan", "Ananya", "Diya", "Rohan", "Isha", "Kiran", "Meera", "Arjun", "Sneha"]
        last = ["Sharma", "Reddy", "Patel", "Nair", "Singh", "Rao", "Iyer", "Das"]
        people = [Passenger.objects.create(name=f"{first[i % 10]} {last[(i * 3) % 8]}",
                  mobile=f"9{random.randint(100000000, 999999999)}", email=f"user{i}@example.com") for i in range(80)]
        routes = [("Hyderabad", "Delhi"), ("Delhi", "Mumbai"), ("Mumbai", "Bengaluru"), ("Bengaluru", "Chennai"),
                  ("Chennai", "Vijayawada"), ("Vijayawada", "Hyderabad"), ("Kolkata", "Delhi"), ("Delhi", "Goa"),
                  ("Mumbai", "Hyderabad"), ("Bengaluru", "Kolkata")]
        fill = [.75, .85, 1.05, 1.0, 1.1, 1.15, 1.4, 1.45, .9, .8]   # -> SAFE / MODERATE / HIGH / CRITICAL
        for i, (src, dst) in enumerate(routes):
            ac = planes[i % 5]
            f = Flight.objects.create(flight_number=f"AI-{201 + i * 3}", source=src, destination=dst,
                                      date=date.today() + timedelta(days=1 + i // 2), departure_time=time(6 + i, 30),
                                      arrival_time=time(8 + i, 45), aircraft=ac)
            n = round(ac.total_seats * fill[i])
            for k, p in enumerate(random.sample(people, n + 3)):
                st = "cancelled" if k >= n else ("checked_in" if i < 5 and random.random() < .2 else "confirmed")
                b = Booking.objects.create(passenger=p, flight=f, seat_number=seat_label(k), status=st,
                                           fare_type=random.choice(["economy"] * 3 + ["premium", "business"]))
                if st == "checked_in":
                    CheckIn.objects.create(booking=b)
        self.stdout.write("Demo data created. Logins: management/admin123, staff/staff123")
