import Header from "../../components/Header/Header";
import { useNavigate } from "react-router-dom";
import "./AgendarVuelo.css";

export default function AgendarVuelo() {
  const navigate = useNavigate();

  const handleCancelar = () => {
    navigate("/alumno/dashboard");
  };

  return (
    <>
      <Header />

      <div className="agendar-container">
        <div className="agendar-header">
          <h2>Agendar nueva cita de vuelo</h2>
          <p>
            Seleccioná hasta <strong>3 bloques</strong> disponibles para solicitar
            tus vuelos.
          </p>
        </div>

        {/* ⬇️ AQUÍ irá el calendario seleccionable */}
        <div className="agendar-calendar-placeholder">
          <p>📅 Calendario de selección (pendiente)</p>
        </div>

        <div className="agendar-actions">
          <button className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>

          <button className="btn-guardar" disabled>
            Guardar solicitud
          </button>
        </div>
      </div>
    </>
  );
}
