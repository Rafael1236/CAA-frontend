import { Navigate, useLocation } from "react-router-dom";

export default function ForcePasswordChange({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();

  if (user?.must_change_password && location.pathname !== "/perfil") {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}
