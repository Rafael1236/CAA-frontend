import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./HeaderPublico.css";

export default function HeaderPublico() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <header className={`hp ${scrolled ? "hp--scrolled" : ""}`}>
      <div className="hp__container">

        <Link to="/" className="hp__logo">
          <div className="hp__logo-icon">✦</div>
          <span className="hp__logo-text">CAAA</span>
        </Link>

        <nav className="hp__nav">
          <ul className="hp__menu">
            <li>
              <Link to="/" className={`hp__link ${location.pathname === "/" ? "hp__link--active" : ""}`}>
                Inicio
              </Link>
            </li>
            <li>
              <a href="/#nosotros" className="hp__link">Nosotros</a>
            </li>
          </ul>

          <div className="hp__actions">
            {!user ? (
              <Link to="/login" className="hp__btn-login">
                INICIAR SESIÓN
              </Link>
            ) : (
              <div className="hp__user">
                <Link to={getDashboardLink()} className="hp__btn-dashboard">
                  MI DASHBOARD
                </Link>
                <button onClick={handleLogout} className="hp__btn-logout" title="Cerrar Sesión">
                  <i className="bi bi-box-arrow-right"></i>
                </button>
              </div>
            )}
          </div>
        </nav>

      </div>
    </header>
  );
}
