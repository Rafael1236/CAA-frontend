import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Login from "./pages/Login/Login";
import DashboardAlumno from "./pages/Alumno/Dashboard";
import ProtectedAlumno from "./components/routes/ProtectedAlumno";
import ProtectedAdmin from "./components/routes/ProtectedAdmin";
import ProtectedProgramacion from "./components/routes/ProtectedProgramacion";
import ProtectedProgramacionPage from "./components/routes/ProtectedProgramacionPage";
import AgendarVuelo from "./pages/Alumno/AgendarVuelo";
import DashboardProgramacion from "./pages/Programacion/Dashboard";
import PaginaProgramacion from "./pages/Proyeccion/PaginaProgramacion";
import DashboardAdmin from "./pages/Admin/Dashboard";
import AuditoriaAdmin from "./pages/Admin/Auditoria";
import MantenimientoAdmin from "./pages/Admin/Mantenimiento";
import TurnoDashboard from "./pages/Turno/Dashboard";
import ProtectedTurno from "./components/routes/ProtectedTurno";
import InstructorDashboard from "./pages/Instructor/Dashboard";
import ProtectedInstructor from "./components/routes/ProtectedInstructor";
import ForcePasswordChange from "./components/routes/ForcePasswordChange";
import Perfil from "./pages/Perfil/Perfil";
import AdminLayout from "./components/AdminLayout/AdminLayout";
import PerfilesAdmin from "./pages/Admin/Perfiles";
import AlumnosAdmin from "./pages/Admin/Alumnos";
import CancelacionesAdmin from "./pages/Admin/Cancelaciones";

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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    };

    const isProyeccion = () =>
      new URLSearchParams(window.location.search).get("modo") === "proyeccion";

    const reset = () => {
      if (isProyeccion()) return;

      const user = readUser();
      if (!user) return;

      if (!localStorage.getItem("token")) {
        logout();
        return;
      }

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
      <Toaster position="top-right" richColors duration={4000} />
      <ForcePasswordChange>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route
            path="/proyeccion"
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
                <AdminLayout>
                  <DashboardAdmin />
                </AdminLayout>
              </ProtectedAdmin>
            }
          />
          <Route
            path="/admin/auditoria"
            element={
              <ProtectedAdmin>
                <AdminLayout>
                  <AuditoriaAdmin />
                </AdminLayout>
              </ProtectedAdmin>
            }
          />
          <Route
            path="/admin/mantenimiento"
            element={
              <ProtectedAdmin>
                <AdminLayout>
                  <MantenimientoAdmin />
                </AdminLayout>
              </ProtectedAdmin>
            }
          />
          <Route
            path="/admin/perfiles"
            element={
              <ProtectedAdmin>
                <AdminLayout>
                  <PerfilesAdmin />
                </AdminLayout>
              </ProtectedAdmin>
            }
          />
          <Route
            path="/admin/alumnos"
            element={
              <ProtectedAdmin>
                <AdminLayout>
                  <AlumnosAdmin />
                </AdminLayout>
              </ProtectedAdmin>
            }
          />
          <Route
            path="/admin/cancelaciones"
            element={
              <ProtectedAdmin>
                <AdminLayout>
                  <CancelacionesAdmin />
                </AdminLayout>
              </ProtectedAdmin>
            }
          />

          <Route
            path="/turno"
            element={
              <ProtectedTurno>
                <TurnoDashboard />
              </ProtectedTurno>
            }
          />

          <Route
            path="/instructor"
            element={
              <ProtectedInstructor>
                <InstructorDashboard />
              </ProtectedInstructor>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ForcePasswordChange>
    </Router>
  );
}

export default App;