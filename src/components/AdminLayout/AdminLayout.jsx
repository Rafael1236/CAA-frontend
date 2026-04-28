import React from "react";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="adm-layout">
      {/* Topbar Global */}
      <header className="adm-topbar">
        <div className="adm-topbar__left">
          <span className="adm-topbar__logo">CAAA</span>
          <span className="adm-topbar__divider">|</span>
          <span className="adm-topbar__title">Administración</span>
        </div>
        <div className="adm-topbar__right">
          <span className="adm-topbar__role">{user.rol || 'ADMIN'}</span>
          <div className="adm-topbar__avatar">AD</div>
        </div>
      </header>

      <div className="adm-layout__body">
        <AdminSidebar />
        <main className="adm-layout__content">
          <div className="adm-layout__inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
