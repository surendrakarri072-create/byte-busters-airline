import { api, useLoad } from "../services/api";
import { Alert, ChartBox, DashboardCard } from "../components/ui";

export default function Dashboard() {
  const { data: d, err } = useLoad(() => api("/dashboard/"), [], 10000); // refreshes every 10 s
  if (err) return <Alert type="danger">{err}</Alert>;
  if (!d) return <p>Loading…</p>;
  const cards = [["Total Flights", d.total_flights, "primary"], ["Total Bookings", d.total_bookings, "info"],
    ["Total Passengers", d.total_passengers, "secondary"], ["Available Seats", d.available_seats, "success"],
    ["Checked-in Passengers", d.checked_in, "dark"], ["Expected No-Shows", d.expected_no_shows, "warning"],
    ["Overbooked Flights", d.overbooked_flights, "danger"], ["Flights at Risk", d.flights_at_risk, "danger"]];
  return (<>
    <h4 className="mb-3">Management Dashboard</h4>
    <div className="row g-3 mb-4">{cards.map(([t, v, c]) => <div key={t} className="col-6 col-lg-3"><DashboardCard title={t} value={v} color={c} /></div>)}</div>
    <div className="row g-3">
      <div className="col-lg-8"><div className="card shadow-sm"><div className="card-body"><h6>Seat capacity vs bookings</h6>
        <ChartBox type="bar" labels={d.flights.map((f) => f.flight_number)} datasets={[
          { label: "Capacity", data: d.flights.map((f) => f.capacity), backgroundColor: "#adb5bd" },
          { label: "Bookings", data: d.flights.map((f) => f.bookings), backgroundColor: "#0d6efd" }]} /></div></div></div>
      <div className="col-lg-4"><div className="card shadow-sm"><div className="card-body"><h6>Flights by risk</h6>
        <ChartBox type="doughnut" labels={Object.keys(d.risk)} datasets={[{ data: Object.values(d.risk), backgroundColor: ["#198754", "#0dcaf0", "#ffc107", "#dc3545"] }]} /></div></div></div>
    </div>
  </>);
}
