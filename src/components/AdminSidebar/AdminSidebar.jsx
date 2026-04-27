import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: "bi-grid-fill" },
    { 
      label: "Programación", 
      path: "/programacion?modo=proyeccion", 
      icon: "bi-calendar3",
      external: true 
    },
    { label: "Mantenimiento", path: "/admin/mantenimiento", icon: "bi-tools" },
    { label: "Perfiles", path: "/admin/perfiles", icon: "bi-person-badge" },
    { label: "Alumnos", path: "/admin/alumnos", icon: "bi-people" },
  ];

  return (
    <aside className="adm-sidebar">
      <div className="adm-sidebar__top">
        <Link to="/admin/dashboard" className="adm-sidebar__logo">
          <div className="adm-sidebar__logo-box">
            <span className="adm-sidebar__logo-icon">A</span>
          </div>
          CAAA
        </Link>
      </div>

      <nav className="adm-sidebar__nav">
        {menuItems.map((item) => (
          item.external ? (
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className="adm-sidebar__link"
            >
              <i className={`bi ${item.icon} adm-sidebar__icon`}></i>
              {item.label}
            </a>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={`adm-sidebar__link ${
                location.pathname === item.path ? "adm-sidebar__link--active" : ""
              }`}
            >
              <i className={`bi ${item.icon} adm-sidebar__icon`}></i>
              {item.label}
            </Link>
          )
        ))}
      </nav>

      <div className="adm-sidebar__bottom">
        <div className="adm-sidebar__user">
          <div className="adm-sidebar__user-info">
            <span className="adm-sidebar__user-name">{user?.nombre}</span>
            <span className="adm-sidebar__user-role">Administrador</span>
          </div>
        </div>
        <div className="adm-sidebar__divider" />
        <button onClick={handleLogout} className="adm-sidebar__logout">
          <i className="bi bi-box-arrow-right adm-sidebar__icon"></i>
          Salir
        </button>
      </div>
    </aside>
  );
}
