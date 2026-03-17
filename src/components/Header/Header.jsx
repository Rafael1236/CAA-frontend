import "./Header.css";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    const rol = user.rol.toUpperCase();
    if (rol === "ADMIN") return "/admin/dashboard";
    if (rol === "PROGRAMACION") return "/programacion/dashboard";
    if (rol === "ALUMNO") return "/alumno/dashboard";
    return "/";
  };

  return (
    <header className="header">
      <div className="header__container">

        <Link to="/" className="header__logo">
          <div className="header__logo-box">
            <span className="header__logo-icon">A</span>
          </div>
          CAAA
        </Link>

        <nav className="header__nav">
          {!user && (
            <>
              <Link to="/" className="header__link">Inicio</Link>
              <Link to="/#nosotros" className="header__link">Nosotros</Link>
              <Link to="/login" className="header__btn-login">Iniciar sesión</Link>
            </>
          )}

          {user && (
            <div className="header__user-box">
              <span className="header__user">
                Hola, <strong>{user.nombre}</strong>
              </span>

              <div className="header__user-actions">
                <Link to={getDashboardLink()} className="header__action-link">
                  <span className="header__action-icon">📊</span>
                  Dashboard
                </Link>

                {(user.rol === "ADMIN" || user.rol === "PROGRAMACION") && (
                  <Link to="/programacion" className="header__action-link">
                    <span className="header__action-icon">📅</span>
                    Programación
                  </Link>
                )}

                <Link to="/perfil" className="header__action-link">
                  <span className="header__action-icon">👤</span>
                  Perfil
                </Link>

                <button onClick={handleLogout} className="header__btn-logout-new">
                  <span className="header__action-icon">🚪</span>
                  Salir
                </button>
              </div>
            </div>
          )}
        </nav>

      </div>
    </header>
  );
}