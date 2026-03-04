import { Navigate, useLocation } from "react-router-dom";

export default function ForcePasswordChange({ children }) {
  const location = useLocation();

  const raw = localStorage.getItem("user");
  if (!raw) return children;

  let user = null;
  try {
    user = JSON.parse(raw);
  } catch {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (user?.expiresAt && Date.now() > user.expiresAt) {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  const mustCompleteProfile = user?.must_change_password || user?.must_set_email;

  if (mustCompleteProfile && location.pathname !== "/perfil") {
    return <Navigate to="/perfil" replace />;
  }

  return children;
}