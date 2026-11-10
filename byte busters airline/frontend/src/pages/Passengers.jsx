import { useState } from "react";
import { api, useLoad } from "../services/api";
import { Alert, Field, Modal } from "../components/ui";
import { PassengerTable } from "../components/Tables";

export default function Passengers() {
  const [q, setQ] = useState("");
  const [f, setF] = useState(null);
  const [err, setErr] = useState("");
  const { data, reload } = useLoad(() => api("/passengers/?q=" + encodeURIComponent(q)), [q], 15000);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    try { await api("/passengers/", "POST", f); setF(null); setErr(""); reload(); } catch (e) { setErr(e.message); }
  };
  return (<>
    <div className="d-flex flex-wrap gap-2 justify-content-between mb-3"><h4 className="mb-0">Passengers</h4>
      <div className="d-flex gap-2">
        <input className="form-control" placeholder="Search name, mobile, email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary text-nowrap" onClick={() => { setErr(""); setF({ name: "", mobile: "", email: "" }); }}>+ Add Passenger</button>
      </div></div>
    <PassengerTable passengers={data || []} />
    <Modal title="Add Passenger" show={!!f} onClose={() => setF(null)} footer={<button className="btn btn-primary" onClick={save}>Save</button>}>
      {err && <Alert type="danger">{err}</Alert>}
      {f && <div className="row g-3"><Field cols="col-12" label="Name" value={f.name} onChange={set("name")} />
        <Field label="Mobile Number" value={f.mobile} onChange={set("mobile")} /><Field label="Email" type="email" value={f.email} onChange={set("email")} /></div>}
    </Modal>
  </>);
}
