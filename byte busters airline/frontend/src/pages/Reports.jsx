import { api, useLoad } from "../services/api";
import { Alert, ChartBox, DashboardCard, RiskBadge } from "../components/ui";

export default function Reports() {
  const { data: r, err } = useLoad(() => api("/reports/"), [], 15000);
  if (err) return <Alert type="danger">{err}</Alert>;
  if (!r) return <p>Loading…</p>;
  const cards = [["Total Flights", r.total_flights, "primary"], ["Total Bookings", r.total_bookings, "info"],
    ["Cancellations", r.cancellations, "secondary"], ["No-shows (incl. history)", r.no_shows, "warning"],
    ["Avg No-show %", r.avg_no_show_pct + "%", "warning"], ["Avg Occupancy", r.avg_occupancy + "%", "success"],
    ["Overbooking Cases", r.overbooking_cases, "danger"]];
  const sc = r.status_counts;
  return (<>
    <h4 className="mb-3">Reports</h4>
    <div className="row g-3 mb-4">{cards.map(([t, v, c]) => <div key={t} className="col-6 col-lg-3"><DashboardCard title={t} value={v} color={c} /></div>)}</div>
    <div className="row g-3 mb-4">
      <div className="col-lg-7"><div className="card shadow-sm"><div className="card-body"><h6>Occupancy % by flight</h6>
        <ChartBox type="bar" labels={r.flights.map((f) => f.flight_number)} datasets={[{ label: "Occupancy %", backgroundColor: "#0d6efd",
          data: r.flights.map((f) => Math.round((f.bookings * 100) / f.capacity)) }]} /></div></div></div>
      <div className="col-lg-5"><div className="card shadow-sm"><div className="card-body"><h6>Bookings by status</h6>
        <ChartBox type="pie" labels={Object.keys(sc)} datasets={[{ data: Object.values(sc), backgroundColor: ["#0d6efd", "#6c757d", "#198754", "#ffc107", "#dc3545"] }]} /></div></div></div>
    </div>
    <div className="table-responsive"><table className="table table-sm bg-white shadow-sm">
      <thead className="table-light"><tr><th>Flight</th><th>Capacity</th><th>Bookings</th><th>Exp. no-shows</th><th>Exp. show-ups</th><th>Safe limit</th><th>Risk</th></tr></thead>
      <tbody>{r.flights.map((f) => <tr key={f.flight_number}><td>{f.flight_number}</td><td>{f.capacity}</td><td>{f.bookings}</td>
        <td>{f.expected_no_shows}</td><td>{f.expected_show_ups}</td><td>{f.safe_limit}</td><td><RiskBadge risk={f.risk} /></td></tr>)}</tbody>
    </table></div>
  </>);
}
