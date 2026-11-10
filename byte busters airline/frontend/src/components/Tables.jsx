import { Link } from "react-router-dom";
import { api, getUser } from "../services/api";
import { RiskBadge } from "./ui";

const Table = ({ head, empty, children }) => (
  <div className="table-responsive"><table className="table table-hover align-middle bg-white small shadow-sm">
    <thead className="table-light"><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
    <tbody>{children}{!children?.length && <tr><td colSpan={head.length} className="text-center text-muted p-4">{empty}</td></tr>}</tbody>
  </table></div>
);

export function FlightTable({ flights = [], manager, onEdit, onCancel }) {
  return (
    <Table empty="No flights found" head={["Flight", "Route", "Date", "Dep", "Arr", "Aircraft", "Seats", "Bookings", "Checked-in", "Exp. no-shows", "Safe limit", "Status", ""]}>
      {flights.map((f) => (
        <tr key={f.id}>
          <td><Link to={`/flights/${f.id}`} className="fw-bold">{f.flight_number}</Link></td>
          <td>{f.source} → {f.destination}</td><td>{f.date}</td>
          <td>{f.departure_time.slice(0, 5)}</td><td>{f.arrival_time.slice(0, 5)}</td>
          <td>{f.aircraft_name}</td><td>{f.capacity}</td><td>{f.bookings}</td><td>{f.checked_in}</td>
          <td>{f.expected_no_shows}</td><td>{f.safe_limit}</td>
          <td><RiskBadge risk={f.risk} /> <span className="badge bg-light text-dark border">{f.status}</span></td>
          <td className="text-nowrap">{manager && <>
            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(f)}>Edit</button>
            {f.status !== "cancelled" && <button className="btn btn-sm btn-outline-danger" onClick={() => onCancel(f)}>Cancel</button>}</>}</td>
        </tr>))}
    </Table>
  );
}

const STATUS_COLOR = { confirmed: "primary", cancelled: "secondary", checked_in: "success", no_show: "warning text-dark", bumped: "danger" };
export const StatusBadge = ({ s }) => <span className={`badge bg-${STATUS_COLOR[s]}`}>{s.replace("_", "-")}</span>;

// Buttons call the API themselves, then tell the page to reload via onChange.
export function BookingTable({ bookings = [], onChange, onError }) {
  const manager = getUser().role === "management";
  const run = async (b, a) => { try { await api(`/bookings/${b.id}/${a}/`, "POST"); onChange(); } catch (e) { onError(e.message); } };
  const setStatus = async (b, status) => { try { await api(`/bookings/${b.id}/`, "PATCH", { status }); onChange(); } catch (e) { onError(e.message); } };
  return (
    <Table empty="No bookings found" head={["Booking ID", "Passenger", "Flight", "Seat", "Fare", "Status", "Check-in", "Actions"]}>
      {bookings.map((b) => (
        <tr key={b.id}>
          <td className="fw-bold">{b.booking_id}</td><td>{b.passenger_name}</td><td>{b.flight_number}</td>
          <td>{b.seat_number}</td><td className="text-capitalize">{b.fare_type}</td>
          <td><StatusBadge s={b.status} /></td><td>{b.checked_in ? "✔ Yes" : "No"}</td>
          <td className="text-nowrap">
            {b.status === "confirmed" && <>
              <button className="btn btn-sm btn-success me-1" onClick={() => run(b, "checkin")}>Check-in</button>
              <button className="btn btn-sm btn-outline-danger me-1" onClick={() => run(b, "cancel")}>Cancel</button></>}
            {manager && <select className="form-select form-select-sm d-inline-block w-auto" value="" onChange={(e) => e.target.value && setStatus(b, e.target.value)}>
              <option value="">Set status…</option><option value="no_show">No-show</option><option value="bumped">Bumped</option><option value="confirmed">Confirmed</option></select>}
          </td>
        </tr>))}
    </Table>
  );
}

export function PassengerTable({ passengers = [] }) {
  return (
    <Table empty="No passengers found" head={["ID", "Name", "Mobile", "Email", "Booking ID", "Flight", "Seat", "Fare", "Booking status", "Check-in"]}>
      {passengers.map((p) => (
        <tr key={p.id}>
          <td>{p.id}</td><td className="fw-semibold">{p.name}</td><td>{p.mobile}</td><td>{p.email}</td>
          <td>{p.latest?.booking_id || "-"}</td><td>{p.latest?.flight || "-"}</td><td>{p.latest?.seat || "-"}</td>
          <td>{p.latest?.fare || "-"}</td><td>{p.latest ? <StatusBadge s={p.latest.status} /> : "-"}</td>
          <td>{p.latest?.status === "checked_in" ? "✔ Yes" : "No"}</td>
        </tr>))}
    </Table>
  );
}
