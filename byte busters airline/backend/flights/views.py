from django.contrib.auth import authenticate
from django.db.models import Count, Q
from rest_framework import serializers, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import SAFE_METHODS, AllowAny, BasePermission
from rest_framework.response import Response
from .models import (ACTIVE, Aircraft, Booking, CheckIn, Flight, NoShowData, Passenger,
                     flight_stats, noshow_rate, seat_label)


class ManagementOrReadOnly(BasePermission):
    """Everyone logged in can read; only management (is_staff) can change."""
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and (request.method in SAFE_METHODS or request.user.is_staff))


def err(msg):
    return serializers.ValidationError({"detail": msg})


# ---------- Serializers ----------
class AircraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aircraft
        fields = "__all__"

    def to_representation(self, a):
        d = super().to_representation(a)
        nxt = a.flight_set.filter(status="scheduled").order_by("date").first()
        used = nxt.bookings.filter(status__in=ACTIVE).count() if nxt else 0
        d["available_seats"] = max(0, a.total_seats - used)   # on its next scheduled flight
        return d


class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = "__all__"

    def to_representation(self, f):
        d = super().to_representation(f)
        d["aircraft_name"] = str(f.aircraft)
        d.update(flight_stats(f, self.context.get("rate")))
        return d


class PassengerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Passenger
        fields = "__all__"

    def to_representation(self, p):
        d = super().to_representation(p)
        b = p.booking_set.select_related("flight").order_by("-id").first()
        d["latest"] = b and dict(booking_id=b.code, flight=b.flight.flight_number, seat=b.seat_number,
                                 fare=b.get_fare_type_display(), status=b.status)
        return d


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = ["seat_number"]

    def to_representation(self, b):
        d = super().to_representation(b)
        d.update(booking_id=b.code, passenger_name=b.passenger.name, flight_number=b.flight.flight_number,
                 checked_in=b.status == "checked_in")
        return d


# ---------- Viewsets ----------
class AircraftViewSet(viewsets.ModelViewSet):
    queryset = Aircraft.objects.all().order_by("id")
    serializer_class = AircraftSerializer
    permission_classes = [ManagementOrReadOnly]
    http_method_names = ["get", "post", "patch", "head", "options"]


class FlightViewSet(viewsets.ModelViewSet):
    serializer_class = FlightSerializer
    permission_classes = [ManagementOrReadOnly]

    def get_queryset(self):
        qs = Flight.objects.select_related("aircraft").order_by("date", "departure_time")
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(flight_number__icontains=q) | Q(source__icontains=q) | Q(destination__icontains=q))
        return qs

    def get_serializer_context(self):
        c = super().get_serializer_context()
        c["rate"] = noshow_rate()      # calculate once per request
        return c

    def perform_destroy(self, f):      # "delete" = cancel (keeps history)
        f.status = "cancelled"
        f.save()
        f.bookings.filter(status="confirmed").update(status="cancelled")

    @action(detail=True)
    def estimate(self, request, pk=None):
        return Response(flight_stats(self.get_object()))


class PassengerViewSet(viewsets.ModelViewSet):
    serializer_class = PassengerSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = Passenger.objects.order_by("-id")
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(mobile__icontains=q) | Q(email__icontains=q))
        return qs


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = Booking.objects.select_related("passenger", "flight").order_by("-id")
        p = self.request.query_params
        if p.get("flight"):
            qs = qs.filter(flight_id=p["flight"])
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        q = p.get("q", "").strip()
        if q:
            code = q.upper().replace("BK", "")
            cond = Q(passenger__name__icontains=q) | Q(flight__flight_number__icontains=q)
            if code.isdigit():
                cond |= Q(id=int(code) - 1000)
            qs = qs.filter(cond)
        return qs

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        f = ser.validated_data["flight"]
        if f.status != "scheduled":
            raise err("This flight is not open for booking.")
        s = flight_stats(f)
        if s["bookings"] >= s["safe_limit"]:       # the overbooking rule in action
            raise err(f"Safe booking limit ({s['safe_limit']}) reached for this flight.")
        ser.save(status="confirmed", seat_number=seat_label(f.bookings.count()))
        return Response(ser.data, status=201)

    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({"detail": "Only management can change booking status."}, status=403)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        b = self.get_object()
        if b.status != "confirmed":
            raise err("Only confirmed bookings can be cancelled.")
        b.status = "cancelled"
        b.save()
        return Response(self.get_serializer(b).data)

    @action(detail=True, methods=["post"])
    def checkin(self, request, pk=None):
        b = self.get_object()
        if b.status != "confirmed":
            raise err(f"Cannot check in: booking is {b.get_status_display()}.")
        if b.flight.status != "scheduled":
            raise err("Flight is not scheduled.")
        b.status = "checked_in"
        b.save()
        CheckIn.objects.create(booking=b, checked_in_by=request.user)
        return Response({"booking": self.get_serializer(b).data,
                         "flight": FlightSerializer(b.flight, context={"rate": noshow_rate()}).data})


# ---------- Login / password ----------
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    u = authenticate(username=request.data.get("username"), password=request.data.get("password"))
    if not u:
        return Response({"detail": "Invalid username or password."}, status=400)
    t, _ = Token.objects.get_or_create(user=u)
    return Response({"token": t.key, "username": u.username, "role": "management" if u.is_staff else "staff"})


@api_view(["POST"])
def change_password(request):
    u, new = request.user, request.data.get("new_password", "")
    if not u.check_password(request.data.get("old_password", "")):
        return Response({"detail": "Old password is wrong."}, status=400)
    if len(new) < 8:
        return Response({"detail": "New password must be at least 8 characters."}, status=400)
    u.set_password(new)    # stored hashed
    u.save()
    Token.objects.filter(user=u).delete()
    return Response({"token": Token.objects.create(user=u).key})


# ---------- Dashboard / reports / no-show ----------
def summary():
    rate, rows = noshow_rate(), []
    for f in Flight.objects.select_related("aircraft").exclude(status="cancelled").order_by("date"):
        s = flight_stats(f, rate)
        s["flight_number"] = f.flight_number
        rows.append(s)
    risk = {r: sum(1 for x in rows if x["risk"] == r) for r in ("SAFE", "MODERATE", "HIGH", "CRITICAL")}
    return rate, rows, risk


@api_view(["GET"])
def dashboard(request):
    rate, rows, risk = summary()
    return Response(dict(
        total_flights=Flight.objects.count(), total_bookings=Booking.objects.count(),
        total_passengers=Passenger.objects.count(),
        available_seats=sum(r["available_seats"] for r in rows),
        checked_in=sum(r["checked_in"] for r in rows),
        expected_no_shows=sum(r["expected_no_shows"] for r in rows),
        overbooked_flights=sum(1 for r in rows if r["bookings"] > r["capacity"]),
        flights_at_risk=risk["HIGH"] + risk["CRITICAL"], risk=risk, flights=rows))


@api_view(["GET"])
def reports(request):
    if not request.user.is_staff:
        return Response({"detail": "Management only."}, status=403)
    rate, rows, risk = summary()
    counts = {r["status"]: r["n"] for r in Booking.objects.values("status").annotate(n=Count("id"))}
    hist = sum(NoShowData.objects.values_list("no_shows", flat=True))
    occ = [r["bookings"] * 100 / r["capacity"] for r in rows]
    return Response(dict(
        total_flights=Flight.objects.count(), total_bookings=Booking.objects.count(),
        cancellations=counts.get("cancelled", 0), no_shows=counts.get("no_show", 0) + hist,
        avg_no_show_pct=rate, avg_occupancy=round(sum(occ) / len(occ), 1) if occ else 0,
        overbooking_cases=sum(1 for r in rows if r["bookings"] > r["capacity"]),
        risk=risk, status_counts=counts, flights=rows))


@api_view(["GET"])
def noshow(request):
    return Response({"rate": noshow_rate(), "records": list(NoShowData.objects.values()),
                     "note": "Estimate based on past data - not a guaranteed prediction."})
