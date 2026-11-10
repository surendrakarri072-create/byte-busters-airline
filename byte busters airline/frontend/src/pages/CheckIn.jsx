import { useState } from "react";
import { api } from "../services/api";
import { Alert, RiskBadge } from "../components/ui";
import { StatusBadge } from "../components/Tables";

export default function CheckIn() {
  const [id, setId] = useState("");
  const [b, setB] = useState(null);
  const [msg, setMsg] = useState(null);
  const [flight, setFlight] = useState(null);
  const search = async () => {
    setFlight(null); setMsg(null);
    try {
      const r = await api("/bookings/?q=" + encodeURIComponent(id.trim()));
      if (!r.length) { setB(null); setMsg({ t: "warning", m: "No booking found." }); } else setB(r[0]);
    } catch (e) { setMsg({ t: "danger", m: e.message }); }
  };
  const checkin = async () => {
    try {
      const r = await api(`/bookings/${b.id}/checkin/`, "POST");
      setB(r.booking); setFlight(r.flight); setMsg({ t: "success", m: "Passenger checked in." });
    } catch (e) { setMsg({ t: "danger", m: e.message }); }
  };
  return (<div style={{ maxWidth: 560 }}>
    <h4 className="mb-3">Passenger Check-in</h4>
    <div className="input-group mb-3">
      <input className="form-control" placeholder="Booking ID e.g. BK1005" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
      <button className="btn btn-primary" onClick={search}>Search</button></div>
    {msg && <Alert type={msg.t} onClose={() => setMsg(null)}>{msg.m}</Alert>}
    {b && <div className="card shadow-sm"><div className="card-body">
      <h5>{b.passenger_name} <StatusBadge s={b.status} /></h5>
      <p className="mb-3 text-muted">Booking {b.booking_id} · Flight {b.flight_number} · Seat {b.seat_number} · <span className="text-capitalize">{b.fare_type}</span></p>
      <button className="btn btn-success" disabled={b.status !== "confirmed"} onClick={checkin}>CHECK-IN</button>
      {flight && <div className="mt-3 small">Flight {flight.flight_number} now: <b>{flight.checked_in}</b> checked in of <b>{flight.bookings}</b> bookings (capacity {flight.capacity}) · <RiskBadge risk={flight.risk} /></div>}
    </div></div>}
  </div>);
}
