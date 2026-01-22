import "./Header.css";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          ✈️ Escuela de Aviación
        </div>

        <nav className="header__nav">
          {!user && (
            <>
              <Link to="/" className="header__link">Inicio</Link>
              <Link to="/login" className="btn-login">Iniciar sesión</Link>
            </>
          )}

          {user && (
            <div className="header__user-box">
              <span className="header__user">
                Hola, <strong>{user.nombre}</strong>
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Cerrar sesión
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
