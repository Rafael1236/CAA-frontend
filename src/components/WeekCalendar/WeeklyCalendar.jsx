import { useEffect, useState } from "react";
import {
  getMiHorario,
  cancelarVuelo,
  getBloquesBloqueadosAlumno,
} from "../../services/alumnoApi";

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
  const [aeronaves, setAeronaves] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [calendar, setCalendar] = useState({});
  const [loading, setLoading] = useState(false);

  const isBloqueado = (id_bloque, dia_semana) => {
    if (!Array.isArray(bloqueos)) return false;
    return bloqueos.some(
      (x) => x.id_bloque === id_bloque && x.dia_semana === dia_semana
    );
  };

  const loadBase = async () => {
    const [b, a, blq] = await Promise.all([
      getBloquesHorario(),
      getAeronavesPermitidas(),
      getBloquesBloqueadosAlumno(),
    ]);

    setBloques(Array.isArray(b) ? b : []);
    setAeronaves(Array.isArray(a) ? a : []);
    setBloqueos(Array.isArray(blq) ? blq : []);
  };

  const loadHorario = async () => {
    setLoading(true);

    const data = await getMiHorario(weekMode);
    const grid = {};

    (Array.isArray(data) ? data : []).forEach((item) => {
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
      });
    });

    setCalendar(grid);
    setLoading(false);
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (bloques.length > 0 && aeronaves.length > 0) {
      loadHorario();
    }
  }, [weekMode, bloques.length, aeronaves.length]);

  const onCancelar = async (id_vuelo) => {
    if (!window.confirm("¿Cancelar este vuelo?")) return;

    try {
      await cancelarVuelo(id_vuelo);
      alert("Vuelo cancelado correctamente");
      await loadHorario();
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo cancelar el vuelo");
    }
  };

  return (
    <div className="calendar-wrapper">
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
            aeronaves.map((a, idx) => (
              <tr key={`${b.id_bloque}-${a.codigo}`}>
                {idx === 0 && (
                  <td rowSpan={aeronaves.length} className="hora-cell">
                    {formatHora12(b.hora_inicio)}
                  </td>
                )}

                <td className="aeronave-cell">{a.codigo}</td>

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

                            {v.estado !== "CANCELADO" &&
                              weekMode === "current" && (
                                <button
                                  className="btn-cancelar-vuelo"
                                  onClick={() => onCancelar(v.id_vuelo)}
                                >
                                  Cancelar
                                </button>
                              )}
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
