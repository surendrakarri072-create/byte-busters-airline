import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { getUser } from "./services/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Flights from "./pages/Flights";
import FlightDetail from "./pages/FlightDetail";
import Aircraft from "./pages/Aircraft";
import Passengers from "./pages/Passengers";
import Bookings from "./pages/Bookings";
import CheckIn from "./pages/CheckIn";
import Reports from "./pages/Reports";

// Every page except /login needs a logged-in user. Reports is management only.
function Protected({ managerOnly }) {
  const u = getUser();
  if (!u) return <Navigate to="/login" />;
  if (managerOnly && u.role !== "management") return <Navigate to="/dashboard" />;
  return <Layout><Outlet /></Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/flights/:id" element={<FlightDetail />} />
          <Route path="/aircraft" element={<Aircraft />} />
          <Route path="/passengers" element={<Passengers />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/checkin" element={<CheckIn />} />
        </Route>
        <Route element={<Protected managerOnly />}><Route path="/reports" element={<Reports />} /></Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
