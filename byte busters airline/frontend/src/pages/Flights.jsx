import { useState } from "react";
import { api, getUser, useLoad } from "../services/api";
import { Alert, Field, Modal } from "../components/ui";
import { FlightTable } from "../components/Tables";

const empty = { flight_number: "", source: "", destination: "", date: "", departure_time: "", arrival_time: "", aircraft: "", safety_buffer: 3, status: "scheduled" };

export default function Flights() {
  const manager = getUser().role === "management";
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const { data: flights, reload } = useLoad(() => api("/flights/?q=" + encodeURIComponent(q)), [q], 10000);
  const { data: aircraft } = useLoad(() => api("/aircraft/"));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async () => {
    try {
      form.id ? await api(`/flights/${form.id}/`, "PATCH", form) : await api("/flights/", "POST", form);
      setForm(null); setErr(""); reload();
    } catch (e) { setErr(e.message); }
  };
  const cancel = async (f) => { if (confirm(`Cancel flight ${f.flight_number}?`)) { await api(`/flights/${f.id}/`, "DELETE"); reload(); } };
  return (<>
    <div className="d-flex flex-wrap gap-2 justify-content-between mb-3">
      <h4 className="mb-0">Flights</h4>
      <div className="d-flex gap-2">
        <input className="form-control" placeholder="Search flight, source, destination…" value={q} onChange={(e) => setQ(e.target.value)} />
        {manager && <button className="btn btn-primary text-nowrap" onClick={() => { setErr(""); setForm(empty); }}>+ Add Flight</button>}
      </div>
    </div>
    <FlightTable flights={flights || []} manager={manager} onEdit={(f) => { setErr(""); setForm(f); }} onCancel={cancel} />
    <Modal title={form?.id ? "Edit Flight" : "Add Flight"} show={!!form} onClose={() => setForm(null)}
      footer={<button className="btn btn-primary" onClick={save}>Save</button>}>
      {err && <Alert type="danger">{err}</Alert>}
      {form && <div className="row g-3">
        <Field label="Flight Number" value={form.flight_number} onChange={set("flight_number")} />
        <Field label="Aircraft" as="select" value={form.aircraft} onChange={set("aircraft")}>
          <option value="">Select…</option>{(aircraft || []).map((a) => <option key={a.id} value={a.id}>{a.name} – {a.model} ({a.total_seats} seats)</option>)}</Field>
        <Field label="Source" value={form.source} onChange={set("source")} />
        <Field label="Destination" value={form.destination} onChange={set("destination")} />
        <Field label="Date" type="date" value={form.date} onChange={set("date")} />
        <Field label="Safety Buffer (seats)" type="number" min="0" value={form.safety_buffer} onChange={set("safety_buffer")} />
        <Field label="Departure Time" type="time" value={form.departure_time} onChange={set("departure_time")} />
        <Field label="Arrival Time" type="time" value={form.arrival_time} onChange={set("arrival_time")} />
        <Field label="Flight Status" as="select" value={form.status} onChange={set("status")}>
          <option value="scheduled">Scheduled</option><option value="departed">Departed</option><option value="cancelled">Cancelled</option></Field>
      </div>}
    </Modal>
  </>);
}
