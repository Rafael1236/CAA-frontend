import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { login } from "../../services/loginApi";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await login(username, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const user = data.user;

      if (user.must_change_password || user.must_set_email) {
        navigate("/perfil");
        return;
      }

      if (user.rol === "ALUMNO") navigate("/alumno/dashboard");
      else if (user.rol === "PROGRAMACION") navigate("/programacion/dashboard");
      else if (user.rol === "ADMIN") navigate("/admin/dashboard");
      else if (user.rol === "TURNO") navigate("/turno");
      else if (user.rol === "INSTRUCTOR") navigate("/instructor");
    } catch {
      toast.error("Credenciales incorrectas");
    }
  };

  const params = new URLSearchParams(window.location.search);
  const reason = params.get("reason");

  return (
    <div className="login">

      <div className="login__bg-img" />
      <div className="login__mesh" />
      <div className="login__grid" />
      <div className="login__glow-red" />
      <div className="login__glow-blue" />

      <form onSubmit={handleSubmit} className="login__card">

        <div className="login__logo">
          <span className="login__logo-icon">✈</span>
          CAAA
        </div>

        <h2 className="login__title">Iniciar sesión</h2>

        {reason === "timeout" && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            color: "#ef4444",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            Su sesión fue cerrada por inactividad.
          </div>
        )}

        {reason === "conflict" && (
          <div style={{
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            border: "1px solid #f59e0b",
            color: "#f59e0b",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            Sesión cerrada: se ha iniciado sesión en otro dispositivo.
          </div>
        )}
        <div className="login__field">
          <label className="login__label">Usuario</label>
          <input
            className="login__input"
            type="text"
            placeholder="Tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="login__field">
          <label className="login__label">Contraseña</label>
          <div className="login__input-wrap">
            <input
              className="login__input"
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login__eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className="login__submit">
          Ingresar
        </button>



        <p className="login__footer">
          © {new Date().getFullYear()} Centro de Adiestramiento Aéreo Académico
        </p>

      </form>
    </div>
  );
}