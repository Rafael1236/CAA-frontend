import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import AgendarCalendar from "../../components/AgendarCalendar/AgendarCalendar";
import { getMiLicencia } from "../../services/alumnoApi";
import {getAeronavesPermitidas,getMisSolicitudes,guardarSolicitud,} from "../../services/agendarApi";

import "./AgendarVuelo.css";

export default function AgendarVuelo() {
  const navigate = useNavigate();

  const [licencia, setLicencia] = useState(null);
  const [aeronaves, setAeronaves] = useState([]);
  const [selecciones, setSelecciones] = useState([]);
  const [estadoSolicitud, setEstadoSolicitud] = useState("BORRADOR");

  const handleGuardar = async () => {
    if (selecciones.length === 0) return;

    try {
      await guardarSolicitud(selecciones);
      alert("Solicitud guardada correctamente");
      navigate("/alumno/dashboard");
    } catch (err) {
      if (err.response?.status === 409) {
        alert("Uno de los bloques ya fue tomado por otro alumno");
      } else if (err.response?.status === 403) {
        alert("La solicitud ya no puede modificarse");
      } else {
        alert("Error al guardar la solicitud");
      }
    }
  };

  useEffect(() => {
    async function load() {
      const lic = await getMiLicencia();
      const aero = await getAeronavesPermitidas();
      const solicitud = await getMisSolicitudes("next");

      setLicencia(lic);
      setAeronaves(aero);

      if (solicitud) {
        setEstadoSolicitud(solicitud.estado);
        setSelecciones(solicitud.vuelos || []);
      }
    }
    load();
  }, []);

  const bloqueado = estadoSolicitud !== "BORRADOR";

return (
  <>
    <Header />

    <div className="agendar-container">
      <h2>Agendar vuelos</h2>
      <p className="agendar-subtitle">Próxima semana</p>

      {licencia && (
        <div className="info-box">
          <span className="info-label">Licencia</span>
          <span className="info-value">{licencia.nombre}</span>
        </div>
      )}

      {bloqueado && (
        <div className="alerta">
          Tu solicitud está en <strong>{estadoSolicitud}</strong> y no puede
          modificarse.
        </div>
      )}

      <div className="section">
        <div className="section__header">
          <h3 className="section__title">Aeronaves permitidas</h3>
          <p className="section__hint">
            Solo podés agendar vuelos con estas aeronaves
          </p>
        </div>
        

        <div className="aeronaves-grid">
          {aeronaves.map((a) => (
            <div key={a.id_aeronave} className="aeronave-card">
              <strong>{a.codigo}</strong>
              <span>{a.modelo}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="acciones">
        <button
          className="btn-cancelar"
          onClick={() => navigate("/alumno/dashboard")}
        >
          Cancelar
        </button>

        <button
          className="btn-guardar"
          disabled={bloqueado || selecciones.length === 0}
          onClick={handleGuardar}
        >
          Guardar ({selecciones.length}/3)
        </button>
      </div>


      <div className="section">
        <div className="section__header">
          <h3 className="section__title">Seleccioná tus vuelos</h3>
          <p className="section__hint">
            Máximo 3 bloques · lunes a sábado
          </p>
        </div>

        <AgendarCalendar
          selecciones={selecciones}
          setSelecciones={setSelecciones}
          bloqueado={bloqueado}
        />
      </div>

      
    </div>
  </>
);

}
