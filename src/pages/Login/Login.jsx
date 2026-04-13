import "./Login.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

      const user = {
        ...data,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };

      localStorage.setItem("user", JSON.stringify(user));

      if (user.must_change_password || user.must_set_email) {
        navigate("/perfil");
        return;
      }

      if (user.rol === "ALUMNO")          navigate("/alumno/dashboard");
      else if (user.rol === "PROGRAMACION") navigate("/programacion/dashboard");
      else if (user.rol === "ADMIN")      navigate("/admin/dashboard");
      else if (user.rol === "TURNO")       navigate("/turno");
      else if (user.rol === "INSTRUCTOR")  navigate("/instructor");
    } catch {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="login">

      <div className="login__grid" />
      <div className="login__glow" />
      <div className="login__ring login__ring--1" />
      <div className="login__ring login__ring--2" />

      <form onSubmit={handleSubmit} className="login__card">

        <div className="login__logo">
          <span className="login__logo-icon">✈</span>
          CAAA
        </div>

        <h2 className="login__title">Iniciar sesión</h2>
        <p className="login__sub">Plataforma de gestión de vuelos</p>

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
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className="login__submit">
          Ingresar
        </button>

        <Link to="/" className="login__back">
          ← Volver al inicio
        </Link>

        <p className="login__footer">
          © {new Date().getFullYear()} Centro de Adiestramiento Aéreo Académico
        </p>

      </form>
    </div>
  );
}