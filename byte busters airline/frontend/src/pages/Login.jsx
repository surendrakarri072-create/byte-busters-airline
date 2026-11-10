import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Alert } from "../components/ui";

export default function Login() {
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    try { localStorage.setItem("user", JSON.stringify(await api("/login/", "POST", f))); nav("/dashboard"); }
    catch (x) { setErr(x.message); }
  };
  return (
    <div className="min-vh-100 d-flex align-items-center bg-primary p-3">
      <form onSubmit={submit} className="card shadow mx-auto w-100" style={{ maxWidth: 380 }}><div className="card-body p-4">
        <h4 className="text-center mb-1">✈ Overbooking Manager</h4>
        <p className="text-center text-muted small">Management / Staff login</p>
        {err && <Alert type="danger">{err}</Alert>}
        <input className="form-control mb-3" placeholder="Username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <input className="form-control mb-3" type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button className="btn btn-primary w-100">Login</button>
        <p className="small text-muted mt-3 mb-0">Demo: management / admin123 · staff / staff123</p>
      </div></form>
    </div>
  );
}
