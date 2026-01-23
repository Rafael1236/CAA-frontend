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

      <div className="dashboard-container">
        <h2>Hola, {user.nombre || "Alumno"}</h2>
        <p className="dashboard-subtitle">
          Aquí podés ver tu horario semanal.
        </p>

        <div className="cards">
          <div className="card">
            <div className="card__label">Licencia</div>
            <div className="card__value">{alumnoInfo.licencia}</div>
          </div>

          <div className="card">
            <div className="card__label">Instructor</div>
            <div className="card__value">{alumnoInfo.instructor}</div>
          </div>

          <div className="card">
            <div className="card__label">Semana</div>
            <div className="card__value">{alumnoInfo.semanaLabel}</div>
          </div>

          <div className="card">
            <div className="card__label">Estado</div>
            <div className="card__value">{alumnoInfo.estadoSemana}</div>
          </div>
        </div>

        <div className="section">
          <div className="section__header">
            <div>
              <h3 className="section__title">Horario semanal</h3>
              <p className="section__hint">Lunes a sábado • bloques por hora</p>
            </div>
            
            <div className="section__actions">
              <button className="btn-agendar" onClick={handleAgendar}>
                Agendar clase
              </button>
            </div>

            <WeekSelector selected={weekMode} onChange={setWeekMode} />
          </div>

          <WeeklyCalendar weekMode={weekMode} />
        </div>
      </div>
    </>
  );
}