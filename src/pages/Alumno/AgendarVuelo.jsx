import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
  const [limiteVuelos, setLimiteVuelos] = useState(3);
  const [yaGuardado, setYaGuardado] = useState(false);

  const handleGuardar = async () => {
    if (selecciones.length === 0) return;

    try {
      await guardarSolicitud(selecciones);
      setYaGuardado(true);
      toast.success("Solicitud guardada correctamente");
      navigate("/alumno/dashboard");
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Uno de los bloques ya fue tomado por otro alumno");
      } else if (err.response?.status === 403) {
        toast.warning("La solicitud ya no puede modificarse");
      } else {
        toast.error("Error al guardar la solicitud");
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
        const limite = solicitud.limite_vuelos ?? 3;
        setLimiteVuelos(limite);
        const vuelos = solicitud.vuelos || [];
        setSelecciones(vuelos);
        // Si ya hay vuelos guardados y ocupan el límite, marcar como ya guardado
        if (vuelos.length > 0 && vuelos.length >= limite) {
          setYaGuardado(true);
        }
      }
    }
    load();
  }, []);

  const now = new Date();
  const svDateStr = now.toLocaleString("en-US", { timeZone: "America/El_Salvador" });
  const svDate = new Date(svDateStr);
  let diaSemanaActual = svDate.getDay();
  if (diaSemanaActual === 0) diaSemanaActual = 7;

  const diasNombres = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  
  const agendaAbierta = licencia?.dia_apertura_agenda 
    ? diaSemanaActual >= licencia.dia_apertura_agenda 
    : true;

  const agendaBloqueada = !agendaAbierta;

  const bloqueadoPorEstado = estadoSolicitud !== "BORRADOR";
  const limiteAlcanzado = selecciones.length >= limiteVuelos;
  const guardadoCompleto = yaGuardado && limiteAlcanzado;
  
  const calendarBloqueado = bloqueadoPorEstado || guardadoCompleto || agendaBloqueada;
  const saveBloqueado = bloqueadoPorEstado || selecciones.length === 0 || guardadoCompleto || agendaBloqueada;

  return (
    <>
      <Header />

      <div className="ag">

        <div className="ag__top">
          <div>
            <p className="ag__eyebrow">Próxima semana</p>
            <h2 className="ag__title">Agendar vuelos</h2>
            <p className="ag__subtitle">
              Seleccioná hasta {limiteVuelos} bloques de vuelo para la semana siguiente.
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
              disabled={saveBloqueado || (selecciones.length > limiteVuelos)}
              onClick={handleGuardar}
            >
              {selecciones.length > limiteVuelos ? "Exceso de vuelos" : `Guardar (${selecciones.length}/${limiteVuelos})`}
            </button>
          </div>

        </div>

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
              {selecciones.length} / {limiteVuelos}
            </span>
          </div>
          <div className="ag__info-card">
            <span className="ag__info-label">Estado solicitud</span>
            <span className={`ag__info-value ${bloqueadoPorEstado || guardadoCompleto ? "ag__info-value--warn" : "ag__info-value--teal"}`}>
              {estadoSolicitud}
            </span>
          </div>
        </div>

        {agendaBloqueada && (
          <div className="ag__alert ag__alert--locked">
            <span className="ag__alert-icon">🔒</span>
            <div>
              <strong>Agenda cerrada:</strong> La agenda para tu nivel <strong>{licencia?.nombre}</strong> abre el <strong>{diasNombres[licencia.dia_apertura_agenda]}</strong>. 
              <br />
              <small>Hoy es {diasNombres[diaSemanaActual]}. Los espacios se habilitarán automáticamente el día programado.</small>
            </div>
          </div>
        )}

        {bloqueadoPorEstado && (
          <div className="ag__alert">
            <span className="ag__alert-icon">⚠</span>
            Tu solicitud está en <strong>{estadoSolicitud}</strong> y ya no puede
            modificarse.
          </div>
        )}

        {selecciones.length > limiteVuelos && (
          <div className="ag__alert ag__alert--warn">
            <span className="ag__alert-icon">⚠</span>
            <strong>Límite excedido:</strong> Tu límite actual es de {limiteVuelos} vuelos, pero tenés {selecciones.length} seleccionados. Por favor, desmarcá {selecciones.length - limiteVuelos} para poder guardar.
          </div>
        )}

        {guardadoCompleto && !bloqueadoPorEstado && (
          <div className="ag__alert ag__alert--info">
            <span className="ag__alert-icon">✓</span>
            Tu solicitud ya fue guardada ({selecciones.length}/{limiteVuelos} vuelos). Esperá a que sea revisada.
          </div>
        )}


        {limiteAlcanzado && !guardadoCompleto && !bloqueadoPorEstado && (
          <div className="ag__alert ag__alert--ready">
            <span className="ag__alert-icon">→</span>
            Seleccionaste {selecciones.length}/{limiteVuelos} vuelos. Presioná <strong>Guardar</strong> para confirmar tu solicitud.
          </div>
        )}

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

        <div className="ag__section">
          <div className="ag__section-header">
            <h3 className="ag__section-title">Seleccioná tus vuelos</h3>
            <p className="ag__section-hint">Máximo {limiteVuelos} bloques · lunes a sábado</p>
          </div>
          <AgendarCalendar
            selecciones={selecciones}
            setSelecciones={setSelecciones}
            bloqueado={calendarBloqueado}
            limiteVuelos={limiteVuelos}
          />
        </div>

      </div>
    </>
  );
}