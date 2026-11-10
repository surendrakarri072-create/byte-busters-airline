import { useState } from "react";
import { api, useLoad } from "../services/api";
import { Alert, Field, Modal } from "../components/ui";
import { BookingTable } from "../components/Tables";

export default function Bookings() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [f, setF] = useState(null);
  const [err, setErr] = useState("");
  const { data, reload } = useLoad(() => api(`/bookings/?q=${encodeURIComponent(q)}&status=${status}`), [q, status], 10000);
  const { data: passengers } = useLoad(() => api("/passengers/"));
  const { data: flights } = useLoad(() => api("/flights/"));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    try { await api("/bookings/", "POST", f); setF(null); setErr(""); reload(); } catch (e) { setErr(e.message); }
  };
  return (<>
    <div className="d-flex flex-wrap gap-2 justify-content-between mb-3"><h4 className="mb-0">Bookings</h4>
      <div className="d-flex gap-2 flex-wrap">
        <input className="form-control w-auto" placeholder="Booking ID, passenger, flight…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="form-select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>{["confirmed", "cancelled", "checked_in", "no_show", "bumped"].map((s) => <option key={s} value={s}>{s.replace("_", "-")}</option>)}</select>
        <button className="btn btn-primary" onClick={() => { setErr(""); setF({ passenger: "", flight: "", fare_type: "economy" }); }}>+ New Booking</button>
      </div></div>
    {err && !f && <Alert type="danger" onClose={() => setErr("")}>{err}</Alert>}
    <BookingTable bookings={data || []} onChange={reload} onError={setErr} />
    <Modal title="Create Booking" show={!!f} onClose={() => setF(null)} footer={<button className="btn btn-primary" onClick={save}>Book</button>}>
      {err && <Alert type="danger">{err}</Alert>}
      {f && <div className="row g-3">
        <Field label="Passenger" as="select" value={f.passenger} onChange={set("passenger")}><option value="">Select…</option>
          {(passengers || []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mobile})</option>)}</Field>
        <Field label="Flight" as="select" value={f.flight} onChange={set("flight")}><option value="">Select…</option>
          {(flights || []).filter((x) => x.status === "scheduled").map((x) => <option key={x.id} value={x.id}>{x.flight_number} {x.source}→{x.destination} ({x.available_seats} seats left, limit {x.safe_limit})</option>)}</Field>
        <Field label="Fare Type" as="select" value={f.fare_type} onChange={set("fare_type")}>
          <option value="economy">Economy</option><option value="premium">Premium Economy</option><option value="business">Business</option></Field>
        <div className="col-12 form-text">Seat number is assigned automatically. Booking is blocked once the flight reaches its safe booking limit.</div></div>}
    </Modal>
  </>);
}
