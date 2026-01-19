import { Navigate } from "react-router-dom";

export default function ProtectedAlumno({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/login" />;
  if (user.rol !== "Alumno") return <Navigate to="/login" />;

  return children;
}
