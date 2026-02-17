import { useEffect, useState } from "react";
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

export default function AgendarCalendar({ selecciones, setSelecciones, bloqueado }) {
  const [bloques, setBloques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [ocupadas, setOcupadas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);

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
      alert("Solo puedes seleccionar una aeronave por bloque");
      return;
    }

    if (selecciones.length >= 3) {
      alert("Máximo 3 vuelos");
      return;
    }

    setSelecciones([...selecciones, item]);
  };

  return (
    <div className="calendar-wrapper">
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
              <tr key={`${b.id_bloque}-${a.id_aeronave}`}>
                {idx === 0 && (
                  <td rowSpan={aeronaves.length} className="hora-cell">
                    {formatHora(b.hora_inicio)}
                  </td>
                )}

                <td className="aeronave-cell">{a.codigo}</td>

                {DIAS.map((d) => {
                  // ✅ BLOQUEO por día
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
                          ocupado ? "ocupado" : selected ? "selected" : ""
                        }`}
                        disabled={bloqueado || ocupado}
                        onClick={() =>
                          toggle({
                            dia_semana: d.id,
                            id_bloque: b.id_bloque,
                            id_aeronave: a.id_aeronave,
                          })
                        }
                      >
                        {ocupado ? "Ocupado" : selected ? "✓" : ""}
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
