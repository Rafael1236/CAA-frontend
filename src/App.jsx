import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/home/dashboard.jsx";
import Login from "./pages/Login/Login";
import DashboardAlumno from "./pages/Alumno/Dashboard";
import ProtectedAlumno from "./components/routes/ProtectedAlumno";


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
      </Routes>
    </Router>
  );
}

export default App;