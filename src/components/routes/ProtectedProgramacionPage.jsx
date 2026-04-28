import { Navigate } from "react-router-dom";
import { getSession } from "../../utils/auth";

export default function ProtectedProgramacionPage({ children }) {
  const user = getSession();

  if (!user) return <Navigate to="/login" replace />;
  
  const rol = user?.rol?.toUpperCase() || "";
  if (rol !== "PROGRAMACION" && rol !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}
