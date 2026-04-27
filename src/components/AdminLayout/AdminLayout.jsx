import React from "react";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout({ children }) {
  return (
    <div className="adm-layout">
      <AdminSidebar />
      <main className="adm-layout__content">
        <div className="adm-layout__inner">
          {children}
        </div>
      </main>
    </div>
  );
}
