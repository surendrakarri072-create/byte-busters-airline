import { useState } from "react";
import { api, getUser, useLoad } from "../services/api";
import { Alert, Field, Modal } from "../components/ui";

export default function Aircraft() {
  const manager = getUser().role === "management";
  const { data, reload } = useLoad(() => api("/aircraft/"));
  const [f, setF] = useState(null);
  const [err, setErr] = useState("");
  const save = async () => {
    try { await api("/aircraft/", "POST", f); setF(null); setErr(""); reload(); } catch (e) { setErr(e.message); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (<>
    <div className="d-flex justify-content-between mb-3"><h4>Aircraft</h4>
      {manager && <button className="btn btn-primary" onClick={() => setF({ name: "", model: "", total_seats: 180 })}>+ Add Aircraft</button>}</div>
    <div className="table-responsive"><table className="table bg-white shadow-sm align-middle">
      <thead className="table-light"><tr><th>Aircraft</th><th>Model</th><th>Total Seats</th><th>Available (next flight)</th></tr></thead>
      <tbody>{(data || []).map((a) => <tr key={a.id}><td className="fw-bold">{a.name}</td><td>{a.model}</td><td>{a.total_seats}</td><td>{a.available_seats}</td></tr>)}</tbody>
    </table></div>
    <Modal title="Add Aircraft" show={!!f} onClose={() => setF(null)} footer={<button className="btn btn-primary" onClick={save}>Save</button>}>
      {err && <Alert type="danger">{err}</Alert>}
      {f && <div className="row g-3">
        <Field label="Aircraft Name / Number" placeholder="VT-ABC" value={f.name} onChange={set("name")} />
        <Field label="Aircraft Model" placeholder="Airbus A320" value={f.model} onChange={set("model")} />
        <Field label="Total Seats" type="number" min="1" value={f.total_seats} onChange={set("total_seats")} /></div>}
    </Modal>
  </>);
}
