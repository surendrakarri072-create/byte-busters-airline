import { useState } from "react";
import { NavLink } from "react-router-dom";
import { api, getUser, logout } from "../services/api";
import { Alert, Field, Modal } from "./ui";

export function Navbar({ onToggle }) {
  const u = getUser();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ old_password: "", new_password: "" });
  const [msg, setMsg] = useState(null);
  const save = async () => {
    try {
      const r = await api("/change-password/", "POST", f);
      localStorage.setItem("user", JSON.stringify({ ...u, token: r.token }));
      setMsg({ t: "success", m: "Password changed." }); setF({ old_password: "", new_password: "" });
    } catch (e) { setMsg({ t: "danger", m: e.message }); }
  };
  return (<>
    <nav className="navbar navbar-dark bg-primary px-3" style={{ height: 56 }}>
      <div className="d-flex align-items-center gap-2">
        <button className="btn btn-outline-light btn-sm d-md-none" onClick={onToggle}>☰</button>
        <span className="navbar-brand mb-0 fw-bold">✈ Overbooking Manager</span>
      </div>
      <div className="d-flex align-items-center gap-2 text-white small">
        <span className="d-none d-sm-inline">{u.username} <span className="badge bg-light text-dark">{u.role}</span></span>
        <button className="btn btn-light btn-sm" onClick={() => { setMsg(null); setShow(true); }}>Change password</button>
        <button className="btn btn-outline-light btn-sm" onClick={logout}>Logout</button>
      </div>
    </nav>
    <Modal title="Change password" show={show} onClose={() => setShow(false)}
      footer={<button className="btn btn-primary" onClick={save}>Save</button>}>
      {msg && <Alert type={msg.t}>{msg.m}</Alert>}
      <div className="row g-3">
        <Field cols="col-12" label="Old password" type="password" value={f.old_password} onChange={(e) => setF({ ...f, old_password: e.target.value })} />
        <Field cols="col-12" label="New password (min 8 characters)" type="password" value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} />
      </div>
    </Modal>
  </>);
}

export function Sidebar({ open, onNavigate }) {
  const manager = getUser().role === "management";
  const links = [["/dashboard", "📊 Dashboard"], ["/flights", "🛫 Flights"], ["/aircraft", "✈ Aircraft"],
    ["/passengers", "👤 Passengers"], ["/bookings", "🎫 Bookings"], ["/checkin", "✅ Check-in"],
    ...(manager ? [["/reports", "📈 Reports"]] : [])];
  return (
    <aside className={"bg-white border-end p-2 " + (open ? "d-block" : "d-none d-md-block")} style={{ minWidth: 200 }}>
      <ul className="nav nav-pills flex-column">
        {links.map(([to, label]) => (
          <li key={to} className="nav-item"><NavLink to={to} onClick={onNavigate} className="nav-link">{label}</NavLink></li>))}
      </ul>
    </aside>
  );
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  return (<>
    <Navbar onToggle={() => setOpen(!open)} />
    <div className="d-flex flex-column flex-md-row">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <main className="flex-grow-1 p-3 p-md-4 bg-light" style={{ minHeight: "calc(100vh - 56px)", minWidth: 0 }}>{children}</main>
    </div>
  </>);
}
