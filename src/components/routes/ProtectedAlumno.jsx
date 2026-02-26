import { Navigate } from "react-router-dom";

export default function ProtectedAlumno({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.rol !== "ALUMNO") {
    return <Navigate to="/" replace />;
  }

  return children;
}
