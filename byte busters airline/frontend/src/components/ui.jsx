import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export const RISK = {
  SAFE: { color: "success", text: "Expected passengers are comfortably within available seats." },
  MODERATE: { color: "info", text: "Bookings are approaching the safe limit." },
  HIGH: { color: "warning", text: "Expected passengers may exceed available seats." },
  CRITICAL: { color: "danger", text: "There is a high possibility of passenger bumping." },
};

export const RiskBadge = ({ risk }) => (
  <span className={`badge bg-${RISK[risk].color} ${["HIGH", "MODERATE"].includes(risk) ? "text-dark" : ""}`}>{risk}</span>
);

export const Alert = ({ type = "info", onClose, children }) => (
  <div className={`alert alert-${type} d-flex justify-content-between`}>
    <div>{children}</div>{onClose && <button className="btn-close" onClick={onClose} />}
  </div>
);

export const DashboardCard = ({ title, value, color = "primary" }) => (
  <div className={`card border-0 shadow-sm border-start border-4 border-${color} h-100`}>
    <div className="card-body"><div className="text-muted small">{title}</div><div className="fs-2 fw-bold">{value}</div></div>
  </div>
);

// Bootstrap modal controlled by React state (no extra JS needed)
export function Modal({ title, show, onClose, footer, children }) {
  if (!show) return null;
  return (<>
    <div className="modal d-block" tabIndex="-1"><div className="modal-dialog modal-dialog-scrollable modal-lg"><div className="modal-content">
      <div className="modal-header"><h5 className="modal-title">{title}</h5><button className="btn-close" onClick={onClose} /></div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div></div></div>
    <div className="modal-backdrop show" />
  </>);
}

// Label + input/select in one
export function Field({ label, as: As = "input", cols = "col-md-6", children, ...p }) {
  return (<div className={cols}><label className="form-label small fw-semibold">{label}</label>
    <As className={As === "select" ? "form-select" : "form-control"} {...p}>{children}</As></div>);
}

// Small Chart.js wrapper
export function ChartBox({ type, labels, datasets, height = 260 }) {
  const ref = useRef();
  useEffect(() => {
    const c = new Chart(ref.current, { type, data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
    return () => c.destroy();
  }, [type, JSON.stringify(labels), JSON.stringify(datasets)]);
  return <div style={{ height }}><canvas ref={ref} /></div>;
}
