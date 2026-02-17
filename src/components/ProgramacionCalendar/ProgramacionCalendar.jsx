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
  bloques = [],
  aeronaves = [],
  items = [],
  pendingMoves = [],
  bloqueos = [],
  setDragging,
  handleDrop,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeBloqueos = Array.isArray(bloqueos) ? bloqueos : [];

  const semanaPublicada = safeItems.some((i) => i.estado_solicitud === "PUBLICADO");

  const isBloqueado = (dia_semana, id_bloque) =>
    safeBloqueos.some((x) => x.dia_semana === dia_semana && x.id_bloque === id_bloque);

  const findItem = (id_bloque, dia_semana, id_aeronave) =>
    safeItems.find(
      (i) =>
        i.id_bloque === id_bloque &&
        i.dia_semana === dia_semana &&
        i.id_aeronave === id_aeronave
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
                  const bloqueado = isBloqueado(d.id, b.id_bloque);

                  if (bloqueado) {
                    return <td key={d.id} className="slot-almuerzo"></td>;
                  }

                  const item = findItem(b.id_bloque, d.id, a.id_aeronave);
                  const modified = pendingMoves.some((m) => m.id_detalle === item?.id_detalle);

                  const disabled = semanaPublicada;

                  return (
                    <td
                      key={d.id}
                      className={`slot-cell ${disabled ? "disabled" : ""}`}
                      onDragOver={disabled ? undefined : (e) => e.preventDefault()}
                      onDrop={
                        disabled
                          ? undefined
                          : () =>
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
                          draggable={!disabled}
                          onDragStart={() =>
                            !disabled &&
                            setDragging({
                              id_detalle: item.id_detalle,
                              id_bloque: item.id_bloque,
                              dia_semana: item.dia_semana,
                              id_aeronave: item.id_aeronave,
                            })
                          }
                        >
                          <span className="alumno">{item.alumno_nombre}</span>
                          <span className="instructor">{item.instructor_nombre}</span>
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
