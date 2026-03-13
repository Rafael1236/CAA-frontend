import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import AgendarCalendar from "../../components/AgendarCalendar/AgendarCalendar";
import { getMiLicencia } from "../../services/alumnoApi";
import {
  getAeronavesPermitidas,
  getMisSolicitudes,
  guardarSolicitud,
} from "../../services/agendarApi";

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
      const lic  = await getMiLicencia();
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

      <div className="ag">

        {/* ── TOP ── */}
        <div className="ag__top">
          <div>
            <p className="ag__eyebrow">Próxima semana</p>
            <h2 className="ag__title">Agendar vuelos</h2>
            <p className="ag__subtitle">
              Seleccioná hasta 3 bloques de vuelo para la semana siguiente.
            </p>
          </div>

          <div className="ag__top-actions">
            <button
              className="ag__btn-cancel"
              onClick={() => navigate("/alumno/dashboard")}
            >
              Cancelar
            </button>
            <button
              className="ag__btn-save"
              disabled={bloqueado || selecciones.length === 0}
              onClick={handleGuardar}
            >
              Guardar ({selecciones.length}/3)
            </button>
          </div>
        </div>

        {/* ── INFO STRIP ── */}
        <div className="ag__info-strip">
          {licencia && (
            <div className="ag__info-card">
              <span className="ag__info-label">Licencia</span>
              <span className="ag__info-value">{licencia.nombre}</span>
            </div>
          )}
          <div className="ag__info-card">
            <span className="ag__info-label">Seleccionados</span>
            <span className="ag__info-value ag__info-value--teal">
              {selecciones.length} / 3
            </span>
          </div>
          <div className="ag__info-card">
            <span className="ag__info-label">Estado solicitud</span>
            <span className={`ag__info-value ${bloqueado ? "ag__info-value--warn" : "ag__info-value--teal"}`}>
              {estadoSolicitud}
            </span>
          </div>
        </div>

        {/* ── ALERT si bloqueado ── */}
        {bloqueado && (
          <div className="ag__alert">
            <span className="ag__alert-icon">⚠</span>
            Tu solicitud está en <strong>{estadoSolicitud}</strong> y ya no puede
            modificarse.
          </div>
        )}

        {/* ── AERONAVES ── */}
        <div className="ag__section">
          <div className="ag__section-header">
            <h3 className="ag__section-title">Aeronaves permitidas</h3>
            <p className="ag__section-hint">
              Solo podés agendar vuelos con estas aeronaves
            </p>
          </div>
          <div className="ag__aeronaves-grid">
            {aeronaves.map((a) => (
              <div key={a.id_aeronave} className="ag__aeronave-card">
                <span className="ag__aeronave-icon">✈</span>
                <div>
                  <strong>{a.codigo}</strong>
                  <span>{a.modelo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CALENDAR ── */}
        <div className="ag__section">
          <div className="ag__section-header">
            <h3 className="ag__section-title">Seleccioná tus vuelos</h3>
            <p className="ag__section-hint">Máximo 3 bloques · lunes a sábado</p>
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