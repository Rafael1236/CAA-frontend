export default function ProtectedProgramacion({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/login" replace />;
  if (user.rol !== "PROGRAMACION") return <Navigate to="/" replace />;

  return children;
}
