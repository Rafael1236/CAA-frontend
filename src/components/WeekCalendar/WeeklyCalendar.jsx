import { useEffect, useMemo, useState } from "react";
import {
  getMiHorario,
  getBloquesBloqueadosAlumno,
} from "../../services/alumnoApi";
import CancelarVueloModal from "../CancelarVueloModal/CancelarVueloModal";

import {
  getBloquesHorario,
  getAeronavesPermitidas,
} from "../../services/agendarApi";

import "./WeeklyCalendar.css";

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

function formatHora12(hora24) {
  const hhmm = (hora24 || "").slice(0, 5);
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;

  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function WeeklyCalendar({ weekMode }) {
  const [bloques, setBloques] = useState([]);
  const [aeronavesPermitidas, setAeronavesPermitidas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [calendar, setCalendar] = useState({});
  const [loading, setLoading] = useState(false);
  const [horarioRaw, setHorarioRaw] = useState([]);
  const [modalVuelo, setModalVuelo] = useState(null); // { id_vuelo, fecha_hora_vuelo, tipoCancel }
  const [horasTotales, setHorasTotales] = useState(0);

  const isBloqueado = (id_bloque, dia_semana) => {
    if (!Array.isArray(bloqueos)) return false;
    return bloqueos.some(
      (x) => Number(x.id_bloque) === Number(id_bloque) && Number(x.dia_semana) === Number(dia_semana)
    );
  };

  const loadBase = async () => {
    const [b, a, blq] = await Promise.all([
      getBloquesHorario(),
      getAeronavesPermitidas(),
      getBloquesBloqueadosAlumno(),
    ]);

    setBloques(Array.isArray(b) ? b : []);
    setAeronavesPermitidas(Array.isArray(a) ? a : []);
    setBloqueos(Array.isArray(blq) ? blq : []);
  };

  const loadHorario = async () => {
    setLoading(true);

    const data = await getMiHorario(weekMode);
    const safeData = Array.isArray(data?.vuelos) ? data.vuelos : (Array.isArray(data) ? data : []);
    const grid = {};

    safeData.forEach((item) => {
      const id_bloque = item.id_bloque;
      if (!id_bloque) return;

      const aeronave = item.aeronave_codigo;
      const dia = item.dia_semana;

      if (!grid[id_bloque]) grid[id_bloque] = {};
      if (!grid[id_bloque][aeronave]) grid[id_bloque][aeronave] = {};
      if (!grid[id_bloque][aeronave][dia]) grid[id_bloque][aeronave][dia] = [];

      grid[id_bloque][aeronave][dia].push({
        id_vuelo: item.id_vuelo,
        estado: item.estado,
        fecha_hora_vuelo: item.fecha_hora_vuelo,
        aeronave_tipo: item.aeronave_tipo,
        soleado: item.soleado,
        instructor_nombre: item.instructor_nombre,
        licencia_nombre: item.licencia_nombre,
      });
    });

    setHorarioRaw(safeData);
    setCalendar(grid);
    setHorasTotales(safeData.length > 0 ? Number(safeData[0].horas_totales ?? 0) : 0);
    setLoading(false);
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (bloques.length > 0) {
      loadHorario();
    }
  }, [weekMode, bloques.length]);

  const aeronavesVisibles = useMemo(() => {
    const base = Array.isArray(aeronavesPermitidas) ? aeronavesPermitidas : [];

    const porCodigo = new Map(
      base.map((a) => [a.codigo, { ...a, fueraLicencia: false }])
    );

    for (const item of horarioRaw) {
      const codigo = item.aeronave_codigo;
      if (!codigo) continue;

      if (!porCodigo.has(codigo)) {
        porCodigo.set(codigo, {
          codigo,
          fueraLicencia: true,
        });
      }
    }

    return Array.from(porCodigo.values());
  }, [aeronavesPermitidas, horarioRaw]);

  const abrirLoadsheet = (vuelo) => {
    const jwt = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const alumnoData = JSON.parse(user || '{}');
    const nombreAlumno = `${alumnoData.nombre || ''} ${alumnoData.apellido || ''}`.trim();

    let baseUrl = import.meta.env.VITE_LOADSHEET_URL;
    
    if (!baseUrl) {
      if (import.meta.env.PROD) {
        console.error("ERROR CRÍTICO: VITE_LOADSHEET_URL no está definida en el entorno de producción.");
        return;
      }
      baseUrl = 'http://localhost:5174';
    }

    const params = new URLSearchParams({
      id_vuelo: vuelo.id_vuelo,
      jwt: jwt || '',
      token: user || '',
      alumno: nombreAlumno,
      instructor: vuelo.instructor_nombre || '',
      licencia: vuelo.licencia_nombre || ''
    });

    window.open(`${baseUrl}?${params.toString()}`, '_blank');
  };

  const abrirModal = (vuelo) => {
    const msRestantes = new Date(vuelo.fecha_hora_vuelo) - new Date();
    const horasRestantes = msRestantes / (1000 * 60 * 60);
    const tipoCancel = horasRestantes > 24 ? "NORMAL" : "EMERGENCIA";
    setModalVuelo({ ...vuelo, tipoCancel });
  };

  const handleCancelado = async () => {
    setModalVuelo(null);
    await loadHorario();
  };

  return (
    <div className="calendar-wrapper">
      {modalVuelo && (
        <CancelarVueloModal
          vuelo={modalVuelo}
          tipoCancel={modalVuelo.tipoCancel}
          onClose={() => setModalVuelo(null)}
          onCancelado={handleCancelado}
        />
      )}

      {loading && <p>Cargando horario…</p>}

      <table className="calendar">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Aeronave</th>
            {DIAS.map((d) => (
              <th key={d.id}>{d.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {bloques.map((b) =>
            aeronavesVisibles.map((a, idx) => (
              <tr key={`${b.id_bloque}-${a.codigo}`}>
                {idx === 0 && (
                  <td rowSpan={aeronavesVisibles.length} className="hora-cell">
                    {formatHora12(b.hora_inicio)}
                  </td>
                )}

                <td className="aeronave-cell">
                  {a.codigo}
                  {a.fueraLicencia && (
                    <div className="aeronave-extra-note">Asignada</div>
                  )}
                </td>

                {DIAS.map((d) => {
                  if (isBloqueado(b.id_bloque, d.id)) {
                    return <td key={d.id} className="slot-almuerzo"></td>;
                  }

                  const vuelos = calendar?.[b.id_bloque]?.[a.codigo]?.[d.id];

                  return (
                    <td key={d.id} className="slot-cell">
                      {vuelos ? (
                        vuelos.map((v) => (
                          <div
                            key={v.id_vuelo}
                            className={`ocupado estado-${v.estado}`}
                          >
                            <span>{v.estado}</span>

                            {v.estado === "PUBLICADO" && v.id_vuelo && v.aeronave_tipo !== "SIMULADOR" && (
                              horasTotales >= 0 ? (
                                <button
                                  className="btn-plan-vuelo"
                                  onClick={() => abrirLoadsheet(v)}
                                >
                                  {v.loadsheet_estado === 'COMPLETADO' || v.loadsheet_estado === 'ENVIADO'
                                    ? 'Ver plan de vuelo'
                                    : v.loadsheet_estado === 'BORRADOR'
                                    ? 'Revisar plan de vuelo'
                                    : 'Plan de vuelo'}
                                </button>
                              ) : (
                                <span className="plan-vuelo-bloqueado">Plan de vuelo (0+ h)</span>
                              )
                            )}

                            {v.estado === "PUBLICADO" &&
                              weekMode === "current" &&
                              new Date(v.fecha_hora_vuelo) > new Date() && (() => {
                                const ms = new Date(v.fecha_hora_vuelo) - new Date();
                                const esEmergencia = ms / (1000 * 60 * 60) <= 24;
                                return (
                                  <button
                                    className={`btn-cancelar-vuelo${esEmergencia ? " btn-cancelar-emergencia" : ""}`}
                                    onClick={() => abrirModal(v)}
                                  >
                                    {esEmergencia ? "Cancelación de emergencia" : "Solicitar cancelación"}
                                  </button>
                                );
                              })()}
                          </div>
                        ))
                      ) : (
                        <span className="blk"></span>
                      )}
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