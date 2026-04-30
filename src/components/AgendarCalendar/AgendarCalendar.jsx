import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getBloquesHorario,
  getBloquesOcupados,
  getAeronavesPermitidas,
  getBloquesBloqueados,
} from "../../services/agendarApi";
import "./AgendarCalendar.css";

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

export default function AgendarCalendar({ selecciones, setSelecciones, bloqueado, limiteVuelos = 3 }) {
  const [bloques, setBloques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [ocupadas, setOcupadas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [mobileDayOffset, setMobileDayOffset] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function load() {
      setBloques(await getBloquesHorario());
      setAeronaves(await getAeronavesPermitidas());
      setOcupadas(await getBloquesOcupados("next"));
      setBloqueos(await getBloquesBloqueados()); 
    }
    load();
  }, []);

  const formatHora = (hora) => hora?.slice(0, 5) ?? "";

  const isBloqueado = (id_bloque, dia_semana) => {
    if (!Array.isArray(bloqueos)) return false;
    return bloqueos.some(
      (x) => x.id_bloque === id_bloque && x.dia_semana === dia_semana
    );
  };

  const toggle = (item) => {
    if (bloqueado) return;

    const existe = selecciones.find(
      (s) =>
        s.dia_semana === item.dia_semana &&
        s.id_bloque === item.id_bloque &&
        s.id_aeronave === item.id_aeronave
    );

    if (existe) {
      setSelecciones(selecciones.filter((s) => s !== existe));
      return;
    }

    const mismoBloque = selecciones.find(
      (s) => s.dia_semana === item.dia_semana && s.id_bloque === item.id_bloque
    );

    if (mismoBloque) {
      toast.warning("Solo puedes seleccionar una aeronave por bloque");
      return;
    }

    if (selecciones.length >= limiteVuelos) {
      toast.warning(`Máximo ${limiteVuelos} vuelos`);
      return;
    }

    setSelecciones([...selecciones, item]);
  };

  const visibleDays = isMobile ? DIAS.slice(mobileDayOffset, mobileDayOffset + 2) : DIAS;

  return (
    <div className={`calendar-wrapper ${isMobile ? 'is-mobile' : ''}`}>
      
      {isMobile && (
        <div className="calendar-mobile-nav">
          <button 
            disabled={mobileDayOffset === 0} 
            onClick={() => setMobileDayOffset(prev => Math.max(0, prev - 1))}
          >
            <i className="bi bi-chevron-left"></i> Anterior
          </button>
          <span className="nav-label">
            {visibleDays[0].label} - {visibleDays[visibleDays.length - 1].label}
          </span>
          <button 
            disabled={mobileDayOffset >= DIAS.length - 2} 
            onClick={() => setMobileDayOffset(prev => Math.min(DIAS.length - 2, prev + 1))}
          >
            Siguiente <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}


      <table className="calendar">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Aeronave</th>
            {visibleDays.map((d) => (
              <th key={d.id}>{d.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {bloques.map((b) =>
            aeronaves.map((a, idx) => (
              <tr key={`${b.id_bloque}-${a.id_aeronave}`}>
                {idx === 0 && (
                  <td rowSpan={aeronaves.length} className="hora-cell">
                    {formatHora(b.hora_inicio)}
                  </td>
                )}

                  <td className="aeronave-cell">
                    <div className="aeronave-badge">
                      <i className="bi bi-airplane-engines me-2"></i>
                      {a.codigo}
                    </div>
                  </td>

                {visibleDays.map((d) => {
                  if (isBloqueado(b.id_bloque, d.id)) {
                    return <td key={d.id} className="slot-almuerzo"></td>;
                  }

                  const ocupado = ocupadas.some(
                    (o) =>
                      o.dia_semana === d.id &&
                      o.id_bloque === b.id_bloque &&
                      o.id_aeronave === a.id_aeronave
                  );

                  const selected = selecciones.some(
                    (s) =>
                      s.dia_semana === d.id &&
                      s.id_bloque === b.id_bloque &&
                      s.id_aeronave === a.id_aeronave
                  );

                  return (
                    <td key={d.id} className="slot-cell">
                      <button
                        className={`slot-btn ${
                          ocupado ? "ocupado" : selected ? "selected" : "available"
                        }`}
                        disabled={bloqueado || ocupado}
                        onClick={() =>
                          toggle({
                            dia_semana: d.id,
                            id_bloque: b.id_bloque,
                            id_aeronave: a.id_aeronave,
                          })
                        }
                        title={ocupado ? "Bloque ocupado" : selected ? "Seleccionado" : "Disponible para agendar"}
                      >
                        {ocupado ? (
                          <span>Ocupado</span>
                        ) : selected ? (
                          <i className="bi bi-check-lg"></i>
                        ) : (
                          <span className="slot-dot"></span>
                        )}
                      </button>
                    </td>
                  );
                })}

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

  );
}
