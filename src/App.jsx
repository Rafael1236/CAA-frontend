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
import AgendarVuelo from "./pages/Alumno/AgendarVuelo";
import DashboardProgramacion from "./pages/Programacion/Dashboard";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="/programacion/dashboard" element={<DashboardProgramacion />} />
        <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
      </Routes>
    </Router>
  );
}

export default App;