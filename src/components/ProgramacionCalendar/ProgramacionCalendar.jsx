import "./ProgramacionCalendar.css";

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

const formatHora = (h) => h?.slice(0, 5);

export default function ProgramacionCalendar({
  bloques,
  aeronaves,
  items,
  pendingMoves,
  setDragging,
  handleDrop,
}) {

  const safeItems = Array.isArray(items) ? items : [];

  const semanaPublicada = safeItems.some(
    (i) => i.estado_solicitud === "PUBLICADO"
  );

  const findItem = (bloque, dia, aeronave) =>
    safeItems.find(
      (i) =>
        i.id_bloque === bloque &&
        i.dia_semana === dia &&
        i.id_aeronave === aeronave
    );

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
                  if (b.es_almuerzo) {
                    return <td key={d.id} className="slot-almuerzo">Almuerzo</td>;
                  }

                  const item = findItem(b.id_bloque, d.id, a.id_aeronave);
                  const modified = pendingMoves.some(
                    (m) => m.id_detalle === item?.id_detalle
                  );

                  return (
                    <td
                      key={d.id}
                      className={`slot-cell ${semanaPublicada ? "disabled" : ""}`}
                      onDragOver={(e) =>
                        !semanaPublicada && e.preventDefault()
                      }
                      onDrop={() =>
                        !semanaPublicada &&
                        handleDrop({
                          dia_semana: d.id,
                          id_bloque: b.id_bloque,
                          id_aeronave: a.id_aeronave,
                        })
                      }
                    >
                      {item ? (
                        <div
                          className={`slot-card estado-${item.estado_solicitud} ${
                            modified ? "dirty" : ""
                          }`}
                          draggable={!semanaPublicada}
                          onDragStart={() =>
                            !semanaPublicada &&
                            setDragging({
                              id_detalle: item.id_detalle,
                              id_bloque: item.id_bloque,
                              dia_semana: item.dia_semana,
                              id_aeronave: item.id_aeronave,
                            })
                          }
                        >
                          <strong>{item.aeronave_codigo}</strong>
                          <span className="alumno">{item.alumno_nombre}</span>
                          <span className="badge">{item.estado_solicitud}</span>
                        </div>
                      ) : (
                        <span className="slot-empty">—</span>
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
