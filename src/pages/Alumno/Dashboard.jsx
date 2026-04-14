import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import MiHorarioList from "../../components/MiHorarioList/MiHorarioList";
import MetarWidget from "../../components/MetarWidget/MetarWidget";
import EstadoOperacionesWidget from "../../components/EstadoOperacionesWidget/EstadoOperacionesWidget";
import {
  getMiHorario,
  getMiInfo,
} from "../../services/alumnoApi";
import "./Dashboard.css";

const CARD_ICONS = {
  licencia: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      <path d="M6 9h4M6 13h2" />
    </svg>
  ),
  instructor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" />
      <path d="M20 21a8 8 0 1 0-16 0" />
      <path d="M12 11v4M10 15h4" />
    </svg>
  ),
  semana: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  estado: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};

export default function AlumnoDashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const navigate = useNavigate();

  const [weekMode, setWeekMode] = useState("current");
  const [vuelos, setVuelos] = useState([]);
  const [loadingVuelos, setLoadingVuelos] = useState(false);
  const [info, setInfo] = useState(null);
  useEffect(() => {
    getMiInfo().then(setInfo).catch(() => { });
  }, []);

  const fetchVuelos = useCallback(async () => {
    setLoadingVuelos(true);
    try {
      const data = await getMiHorario(weekMode);
      setVuelos(Array.isArray(data?.vuelos) ? data.vuelos : []);
    } catch {
      setVuelos([]);
    } finally {
      setLoadingVuelos(false);
    }
  }, [weekMode]);

  useEffect(() => {
    fetchVuelos();
  }, [fetchVuelos]);

  const instructorNombre = info
    ? [info.instructor_nombre, info.instructor_apellido].filter(Boolean).join(" ") || "—"
    : "—";

  const semanaLabel = weekMode === "current" ? "Semana actual" : "Semana siguiente";
  const estadoLabel = weekMode === "current" ? "En curso" : "Próxima";

  return (
    <>
      <Header />

      <div className="dash">
        {/* ── Top ── */}
        <div className="dash__top">
          <div className="dash__top-left">
            <p className="dash__eyebrow">Panel del alumno</p>
            <h2 className="dash__title">
              Hola, <span className="dash__title-name">{user.nombre || "Alumno"}</span>
            </h2>
            <p className="dash__subtitle">Revisá y gestioná tu horario semanal de vuelos.</p>
          </div>
          <button className="btn-agendar" onClick={() => navigate("/alumno/agendar")}>
            <span>＋</span> Agendar clase
          </button>
        </div>

        {/* ── Info cards ── */}
        <div className="dash__cards">
          <div className="dash__card">
            <span className="dash__card-icon">{CARD_ICONS.licencia}</span>
            <div>
              <div className="dash__card-label">Licencia</div>
              <div className="dash__card-value">{info?.licencia ?? "—"}</div>
            </div>
          </div>

          <div className="dash__card">
            <span className="dash__card-icon">{CARD_ICONS.instructor}</span>
            <div>
              <div className="dash__card-label">Instructor</div>
              <div className="dash__card-value">{instructorNombre}</div>
            </div>
          </div>

          <div className="dash__card">
            <span className="dash__card-icon">{CARD_ICONS.semana}</span>
            <div>
              <div className="dash__card-label">Semana</div>
              <div className="dash__card-value">{semanaLabel}</div>
            </div>
          </div>

          <div className="dash__card">
            <span className="dash__card-icon">{CARD_ICONS.estado}</span>
            <div>
              <div className="dash__card-label">Estado</div>
              <div className="dash__card-value dash__card-value--status">{estadoLabel}</div>
            </div>
          </div>
        </div>

        {/* ── Body: main + sidebar ── */}
        <div className="dash__body">
          <div className="dash__main">
            {/* Tabs */}
            <div className="dash__tabs">
              <button
                className={`dash__tab${weekMode === "current" ? " dash__tab--active" : ""}`}
                onClick={() => setWeekMode("current")}
              >
                Semana actual
              </button>
              <button
                className={`dash__tab${weekMode === "next" ? " dash__tab--active" : ""}`}
                onClick={() => setWeekMode("next")}
              >
                Semana siguiente
              </button>
            </div>

            {/* Flight list */}
            <MiHorarioList
              vuelos={vuelos}
              weekMode={weekMode}
              loading={loadingVuelos}
              onRefresh={fetchVuelos}
            />
          </div>

          {/* ── Sidebar ── */}
          <aside className="dash__sidebar">
            <MetarWidget />
            <EstadoOperacionesWidget />
          </aside>
        </div>
      </div>
    </>
  );
}
