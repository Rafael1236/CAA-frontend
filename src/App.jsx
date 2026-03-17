import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home/Dashboard";
import Login from "./pages/Login/Login";
import DashboardAlumno from "./pages/Alumno/Dashboard";
import ProtectedAlumno from "./components/routes/ProtectedAlumno";
import ProtectedAdmin from "./components/routes/ProtectedAdmin";
import ProtectedProgramacion from "./components/routes/ProtectedProgramacion";
import ProtectedProgramacionPage from "./components/routes/ProtectedProgramacionPage";
import AgendarVuelo from "./pages/Alumno/AgendarVuelo";
import DashboardProgramacion from "./pages/Programacion/Dashboard";
import PaginaProgramacion from "./pages/Programacion/PaginaProgramacion";
import DashboardAdmin from "./pages/Admin/Dashboard";
import ForcePasswordChange from "./components/routes/ForcePasswordChange";
import Perfil from "./pages/Perfil/Perfil";

const IDLE_MS = 10 * 60 * 1000;

function App() {
  useEffect(() => {
    let t;

    const readUser = () => {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        localStorage.removeItem("user");
        return null;
      }
    };

    const logout = () => {
      localStorage.removeItem("user");
      window.location.href = "/login";
    };

    const reset = () => {
      const user = readUser();
      if (!user) return;

      if (user.expiresAt && Date.now() > user.expiresAt) {
        logout();
        return;
      }

      user.expiresAt = Date.now() + IDLE_MS;
      localStorage.setItem("user", JSON.stringify(user));

      clearTimeout(t);
      t = setTimeout(logout, IDLE_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset));

    reset();

    return () => {
      clearTimeout(t);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, []);

  return (
    <Router>
      <ForcePasswordChange>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route
            path="/programacion"
            element={
              <ProtectedProgramacionPage>
                <PaginaProgramacion />
              </ProtectedProgramacionPage>
            }
          />

          <Route
            path="/alumno/dashboard"
            element={
              <ProtectedAlumno>
                <DashboardAlumno />
              </ProtectedAlumno>
            }
          />
          <Route
            path="/alumno/agendar"
            element={
              <ProtectedAlumno>
                <AgendarVuelo />
              </ProtectedAlumno>
            }
          />

          <Route
            path="/programacion/dashboard"
            element={
              <ProtectedProgramacion>
                <DashboardProgramacion />
              </ProtectedProgramacion>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdmin>
                <DashboardAdmin />
              </ProtectedAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ForcePasswordChange>
    </Router>
  );
}

export default App;