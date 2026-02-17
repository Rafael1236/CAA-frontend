import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home/Dashboard";
import Login from "./pages/Login/Login";
import DashboardAlumno from "./pages/Alumno/Dashboard";
import ProtectedAlumno from "./components/routes/ProtectedAlumno";
import ProtectedAdmin from "./components/routes/ProtectedAdmin";
import ProtectedProgramacion from "./components/routes/ProtectedProgramacion";
import AgendarVuelo from "./pages/Alumno/AgendarVuelo";
import DashboardProgramacion from "./pages/Programacion/Dashboard";
import DashboardAdmin from "./pages/Admin/Dashboard";
import ForcePasswordChange from "./components/routes/ForcePasswordChange";
import Perfil from "./pages/Perfil/Perfil";



function App() {
  return (
    <Router>
      <ForcePasswordChange>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/perfil" element={<Perfil />} />
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