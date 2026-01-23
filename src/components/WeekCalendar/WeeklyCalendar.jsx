import { useEffect, useState } from "react";
import { getMiHorario } from "../../services/alumnoApi";
import "./WeeklyCalendar.css";

const BLOQUES = [
  "06:00 AM",
  "07:30 AM",
  "09:00 AM",
  "10:30 AM",
  "11:50 AM",
  "01:30 PM",
  "02:50 PM",
  "04:10 PM",
  "05:20 PM",
];

const AERONAVES = [
  "YS-334-PE",
  "YS-333-PE",
  "YS-270-PE",
  "YS-127-P",
  "YS-155-PE",
  "SIM-1",
];

const DIA_MAP = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const DIAS = Object.values(DIA_MAP);

function formatHora(hora24) {
  const [h, m] = hora24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")} ${ampm}`;
}


export default function WeeklyCalendar({ weekMode }) {
  const [calendar, setCalendar] = useState({});

  useEffect(() => {
    async function load() {
      const data = await getMiHorario(weekMode);
      const grid = {};

      data.forEach((item) => {
        const hora = formatHora(item.hora_inicio);
        const dia = DIA_MAP[item.dia_semana];
        const aeronave = item.aeronave;

        if (!grid[hora]) grid[hora] = {};
        if (!grid[hora][aeronave]) grid[hora][aeronave] = {};
        if (!grid[hora][aeronave][dia]) {
          grid[hora][aeronave][dia] = [];
        }

        grid[hora][aeronave][dia].push({
          estado: item.estado,
        });
      });

      setCalendar(grid);
    }

    load();
  }, [weekMode]);

  return (
    <div className="calendar-wrapper">
      <table className="calendar">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Aeronave</th>
            {DIAS.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {BLOQUES.map((hora) =>
            AERONAVES.map((aeronave, idx) => (
              <tr key={`${hora}-${aeronave}`}>
                {idx === 0 && (
                  <td rowSpan={AERONAVES.length} className="hora-cell">
                    {hora}
                  </td>
                )}

                <td className="aeronave-cell">{aeronave}</td>

                {DIAS.map((dia) => {
                  const vuelos =
                    calendar?.[hora]?.[aeronave]?.[dia];

                  return (
                    <td key={dia} className="slot-cell">
                      {vuelos ? (
                        vuelos.map((v, i) => (
                          <span key={i} className="ocupado">
                            {v.estado}
                          </span>
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