import { useState, useMemo } from "react";
import Header from "../../components/Header/Header";
import WeeklyCalendar from "../../components/WeekCalendar/WeeklyCalendar";
import WeekSelector from "../../components/WeekSelector/WeekSelector";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

export default function AlumnoDashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [weekMode, setWeekMode] = useState("current");
  const navigate = useNavigate();

  const handleAgendar = () => {
    navigate("/alumno/agendar");
  };

  const alumnoInfo = useMemo(() => {
    return {
      licencia: "PPL",
      instructor: "Juan Pérez",
      semanaLabel: weekMode === "current" ? "Semana actual" : "Semana siguiente",
      estadoSemana: weekMode === "current" ? "En curso" : "Próxima",
    };
  }, [weekMode]);

  return (
    <>
      <Header />

      <div className="dash">

        {/* ── PAGE HEADER ── */}
        <div className="dash__top">
          <div className="dash__top-left">
            <p className="dash__eyebrow">Panel del alumno</p>
            <h2 className="dash__title">
              Hola, <span className="dash__title-name">{user.nombre || "Alumno"}</span>
            </h2>
            <p className="dash__subtitle">Revisá y gestioná tu horario semanal de vuelos.</p>
          </div>
          <button className="btn-agendar" onClick={handleAgendar}>
            <span>＋</span> Agendar clase
          </button>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="dash__cards">
          <div className="dash__card">
            <span className="dash__card-icon">🪪</span>
            <div>
              <div className="dash__card-label">Licencia</div>
              <div className="dash__card-value">{alumnoInfo.licencia}</div>
            </div>
          </div>

          <div className="dash__card">
            <span className="dash__card-icon">🧑‍✈️</span>
            <div>
              <div className="dash__card-label">Instructor</div>
              <div className="dash__card-value">{alumnoInfo.instructor}</div>
            </div>
          </div>

          <div className="dash__card">
            <span className="dash__card-icon">📅</span>
            <div>
              <div className="dash__card-label">Semana</div>
              <div className="dash__card-value">{alumnoInfo.semanaLabel}</div>
            </div>
          </div>

          <div className="dash__card">
            <span className="dash__card-icon">🟢</span>
            <div>
              <div className="dash__card-label">Estado</div>
              <div className="dash__card-value dash__card-value--status">
                {alumnoInfo.estadoSemana}
              </div>
            </div>
          </div>
        </div>

        {/* ── CALENDAR SECTION ── */}
        <div className="dash__section">
          <div className="dash__section-header">
            <div className="dash__section-info">
              <h3 className="dash__section-title">Horario semanal</h3>
              <p className="dash__section-hint">Lunes a sábado · bloques por hora</p>
            </div>
            <WeekSelector selected={weekMode} onChange={setWeekMode} />
          </div>

          <WeeklyCalendar weekMode={weekMode} />
        </div>

      </div>
    </>
  );
}