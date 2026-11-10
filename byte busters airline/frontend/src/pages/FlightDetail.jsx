import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getUser, useLoad } from "../services/api";
import { Alert, RISK, RiskBadge } from "../components/ui";
import { BookingTable } from "../components/Tables";

export default function FlightDetail() {
  const { id } = useParams();
  const manager = getUser().role === "management";
  const [buf, setBuf] = useState(null);
  const [msg, setMsg] = useState("");
  const { data: f, err, reload } = useLoad(() => api(`/flights/${id}/`), [id], 8000);
  const { data: bookings, reload: reloadB } = useLoad(() => api(`/bookings/?flight=${id}`), [id], 8000);
  if (err) return <Alert type="danger">{err}</Alert>;
  if (!f) return <p>Loading…</p>;
  const saveBuffer = async () => {
    try { await api(`/flights/${id}/`, "PATCH", { safety_buffer: Number(buf) }); setBuf(null); reload(); }
    catch (e) { setMsg(e.message); }
  };
  const row = (label, value) => <tr><td className="text-muted">{label}</td><td className="fw-bold text-end">{value}</td></tr>;
  return (<>
    <Link to="/flights">← Flights</Link>
    <h4 className="my-3">{f.flight_number}: {f.source} → {f.destination} <small className="text-muted fs-6">{f.date} · {f.departure_time.slice(0, 5)}–{f.arrival_time.slice(0, 5)} · {f.aircraft_name}</small></h4>
    <div className="row g-3 mb-3">
      <div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-body">
        <h6>Occupancy &amp; no-show estimate</h6>
        <table className="table table-sm mb-2"><tbody>
          {row("Seat Capacity", f.capacity)}{row("Current Bookings", f.bookings)}{row("Available Seats", f.available_seats)}
          {row("Checked-in", f.checked_in)}{row("No-show rate (history)", f.no_show_rate + "%")}
          {row("Expected No-Shows", f.expected_no_shows)}{row("Expected Show-ups", f.expected_show_ups)}
          {row("Safe Booking Limit", f.safe_limit)}</tbody></table>
        <div className="small text-muted">
          Expected no-shows = {f.bookings} × {f.no_show_rate} / 100 ≈ {f.expected_no_shows}<br />
          Expected show-ups = {f.bookings} − {f.expected_no_shows} = {f.expected_show_ups}<br />
          Safe limit = {f.capacity} + {f.expected_no_shows} − {f.safety_buffer} (buffer) = {f.safe_limit}
        </div>
        <div className="alert alert-secondary small mt-3 mb-0">⚠ This is an <b>estimate</b> based on past data, not a guaranteed prediction.</div>
      </div></div></div>
      <div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-body">
        <h6>Overbooking risk</h6>
        <div className={`alert alert-${RISK[f.risk].color}`}><b>Status: <RiskBadge risk={f.risk} /></b><div className="mt-1">{RISK[f.risk].text}</div></div>
        <label className="form-label small fw-semibold">Safety buffer (seats)</label>
        <div className="input-group">
          <input type="number" min="0" className="form-control" disabled={!manager} value={buf ?? f.safety_buffer} onChange={(e) => setBuf(e.target.value)} />
          {manager && <button className="btn btn-primary" disabled={buf === null} onClick={saveBuffer}>Update</button>}
        </div>
        {!manager && <div className="form-text">Only management can change the safety buffer.</div>}
        {msg && <Alert type="danger" onClose={() => setMsg("")}>{msg}</Alert>}
      </div></div></div>
    </div>
    <h6>Bookings on this flight</h6>
    <BookingTable bookings={bookings || []} onChange={() => { reload(); reloadB(); }} onError={setMsg} />
  </>);
}
