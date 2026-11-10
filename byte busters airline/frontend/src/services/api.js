import { useCallback, useEffect, useState } from "react";
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const getUser = () => JSON.parse(localStorage.getItem("user") || "null");
export const logout = () => { localStorage.removeItem("user"); window.location = "/login"; };

function errorText(d) {
  if (!d) return "Request failed";
  if (d.detail) return d.detail;
  return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join(" | ");
}

// One small function for every API call. Sends the login token automatically.
export async function api(path, method = "GET", body) {
  const u = getUser();
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(u ? { Authorization: "Token " + u.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && u) logout();
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(errorText(data));
  return data;
}

// Loads data, and re-loads every `ms` milliseconds (simple "real-time" without WebSockets).
export function useLoad(fn, deps = [], ms = 0) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => fn().then((d) => { setData(d); setErr(""); }).catch((e) => setErr(e.message)), deps);
  useEffect(() => {
    load();
    if (ms) { const t = setInterval(load, ms); return () => clearInterval(t); }
  }, [load]);
  return { data, err, reload: load };
}
