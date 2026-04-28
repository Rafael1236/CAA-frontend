import { useState } from "react";
import "./AdminCalendar.css";

const DIAS = [
  { id: 1, label: "LUN", full: "Lunes" },
  { id: 2, label: "MAR", full: "Martes" },
  { id: 3, label: "MIÉ", full: "Miércoles" },
  { id: 4, label: "JUE", full: "Jueves" },
  { id: 5, label: "VIE", full: "Viernes" },
  { id: 6, label: "SÁB", full: "Sábado" },
];

const formatHora = (h) => h?.slice(0, 5);

const getDatesForWeek = (week) => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6 (Sat)
  // Adjust to Monday of current week
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  
  if (week === "next") {
    monday.setDate(monday.getDate() + 7);
  }
  
  const dates = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export default function AdminCalendar({
  bloques = [],
  items = [],
  pendingMoves = [],
  bloqueos = [],
  setDragging,
  dragging,
  handleDrop,
  week = "next",
  instructores = [],
  onCambiarInstructor,
  onRefresh,
  aeronaves = [],
  onGuardarCambio,
}) {
  const isEditable = week === "next";
  const dates = getDatesForWeek(week);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activePopover, setActivePopover] = useState(null); // { item, x, y }
  const [loadingSave, setLoadingSave] = useState(false);
  const [tempAeronaveId, setTempAeronaveId] = useState("");
  const [tempInstructorId, setTempInstructorId] = useState("");

  // id_vuelo → id_instructor seleccionado (pendiente de guardar)
  const [instrPendiente, setInstrPendiente] = useState({});

  const handleInstrChange = (id_vuelo, id_instructor_nuevo) => {
    setInstrPendiente((prev) => ({ ...prev, [id_vuelo]: id_instructor_nuevo }));
  };

  const handleInstrGuardar = async (id_vuelo, id_instructor_original) => {
    const nuevo = instrPendiente[id_vuelo];
    if (!nuevo || Number(nuevo) === Number(id_instructor_original)) return;
    await onCambiarInstructor(id_vuelo, Number(nuevo));
    setInstrPendiente((prev) => {
      const next = { ...prev };
      delete next[id_vuelo];
      return next;
    });
  };

  const safeItems = Array.isArray(items) ? items : [];
  const safeBloqueos = Array.isArray(bloqueos) ? bloqueos : [];

  const isBloqueado = (dia_semana, id_bloque) =>
    safeBloqueos.some((x) => x.dia_semana === dia_semana && x.id_bloque === id_bloque);

  const findItemsForCell = (id_bloque, dia_semana) =>
    safeItems.filter(
      (i) =>
        Number(i.id_bloque) === Number(id_bloque) &&
        Number(i.dia_semana) === Number(dia_semana)
    );

  const handleCardClick = (e, item) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Position popover relative to the card, adjusting for window bounds
    let x = rect.left + window.scrollX;
    let y = rect.bottom + window.scrollY + 5;

    // Boundary check (approx 280px width)
    if (x + 280 > window.innerWidth) {
      x = window.innerWidth - 300;
    }

    setActivePopover({ item, x, y });
    setTempAeronaveId(item.id_aeronave);
    setTempInstructorId(item.id_instructor);
  };

  const closePopover = () => {
    if (!loadingSave) setActivePopover(null);
  };

  const handleSave = async () => {
    if (!activePopover || loadingSave) return;
    setLoadingSave(true);
    const { item } = activePopover;

    try {
      // 1. Change Instructor if modified
      if (Number(tempInstructorId) !== Number(item.id_instructor)) {
        if (onCambiarInstructor) {
          await onCambiarInstructor(item.id_detalle, Number(tempInstructorId));
        }
      }

      // 2. Change Aircraft if modified
      if (Number(tempAeronaveId) !== Number(item.id_aeronave)) {
        const move = {
          id_detalle: item.id_detalle,
          id_bloque: item.id_bloque,
          dia_semana: item.dia_semana,
          id_aeronave: Number(tempAeronaveId)
        };

        if (onGuardarCambio) {
          await onGuardarCambio([move]);
        } else {
          // Fallback to adminApi
          const { guardarCambiosAdmin } = await import("../../services/adminApi");
          await guardarCambiosAdmin([move]);
        }
      }

      closePopover();
      if (onRefresh) onRefresh();
      else window.location.reload(); 
    } catch (e) {
      const { toast } = await import("sonner");
      toast.error(e.response?.data?.message || "Error al guardar cambios");
    } finally {
      setLoadingSave(false);
    }
  };


  const getEstadoClass = (item) => {
    const estado = item?.estado_vuelo || item?.estado_solicitud || item?.estado_mostrar;
    if (["SALIDA_HANGAR", "EN_VUELO", "REGRESO_HANGAR", "FINALIZANDO"].includes(estado)) {
      return "progreso";
    }
    if (estado === "COMPLETADO") return "completado";
    if (estado === "CANCELADO") return "cancelado";
    return "programado";
  };

  return (
    <div className="admin-calendar-root">
      <div className="admin-calendar-container">
        <table className="admin-calendar-modern">
          <thead>
            <tr>
              <th className="corner-cell"></th>
              {dates.map((date, idx) => {
                const isToday = date.getTime() === today.getTime();
                return (
                  <th key={idx} className={isToday ? "current-day" : ""}>
                    <div className="day-label">{DIAS[idx].label} {date.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {bloques.map((b) => (
              <tr key={b.id_bloque}>
                <td className="time-cell">{formatHora(b.hora_inicio)}</td>
                {DIAS.map((d) => {
                  const bloqueado = isBloqueado(d.id, b.id_bloque);
                  const itemsInCell = findItemsForCell(b.id_bloque, d.id);
                  const disabled = !isEditable;

                  return (
                    <td
                      key={d.id}
                      className={`calendar-cell ${bloqueado ? "lunch-cell" : ""} ${disabled ? "readonly" : ""}`}
                      onDragOver={disabled || bloqueado ? undefined : (e) => e.preventDefault()}
                      onDrop={
                        disabled || bloqueado || !dragging
                          ? undefined
                          : () => {
                              handleDrop({
                                dia_semana: d.id,
                                id_bloque: b.id_bloque,
                                id_aeronave: dragging.id_aeronave
                              });
                            }
                      }
                    >
                      <div className="cell-content">
                        {itemsInCell.map((item) => {
                          const modified = pendingMoves.some(
                            (m) => m.id_detalle === item?.id_detalle
                          );
                          const estadoClass = getEstadoClass(item);

                          return (
                            <div
                              key={item.id_detalle}
                              className={`flight-card ${estadoClass} ${modified ? "is-dirty" : ""}`}
                              draggable={!disabled}
                              onClick={(e) => handleCardClick(e, item)}
                              onDragStart={(e) => {
                                if (disabled) return;
                                setDragging({
                                  id_detalle: item.id_detalle,
                                  id_bloque: item.id_bloque,
                                  dia_semana: item.dia_semana,
                                  id_aeronave: item.id_aeronave,
                                });
                              }}
                            >
                              <div className="flight-alumno">{item.alumno_nombre}</div>
                              <div className="flight-aeronave">{item.aeronave_codigo}</div>

                              {/* Instructor change dropdown if needed */}
                              {item.id_vuelo && item.estado_vuelo !== "CANCELADO" && instructores.length > 0 && (
                                <div className="flight-instr-mini" onClick={e => e.stopPropagation()}>
                                  <select
                                    value={instrPendiente[item.id_vuelo] ?? item.id_instructor}
                                    onChange={(e) => handleInstrChange(item.id_vuelo, e.target.value)}
                                  >
                                    {instructores.map(ins => (
                                      <option key={ins.id_instructor} value={ins.id_instructor}>{ins.nombre_completo}</option>
                                    ))}
                                  </select>
                                  {instrPendiente[item.id_vuelo] && Number(instrPendiente[item.id_vuelo]) !== Number(item.id_instructor) && (
                                    <button onClick={() => handleInstrGuardar(item.id_vuelo, item.id_instructor)}>✓</button>
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><span className="dot programado"></span> Programado</div>
        <div className="legend-item"><span className="dot progreso"></span> En progreso</div>
        <div className="legend-item"><span className="dot completado"></span> Completado</div>
        <div className="legend-item"><span className="dot lunch"></span> Almuerzo / Sin vuelos</div>
      </div>

      {/* ── Popover de Edición ── */}
      {activePopover && (
        <>
          <div className="popover-overlay" onClick={closePopover} />
          <div 
            className="flight-popover"
            style={{ top: activePopover.y, left: activePopover.x }}
          >
            <div className="pop-header">
              <div>
                <div className="pop-alumno">{activePopover.item.alumno_nombre}</div>
                <div className={`pop-status-badge ${getEstadoClass(activePopover.item)}`}>
                  {activePopover.item.estado_vuelo || activePopover.item.estado_solicitud || 'PROGRAMADO'}
                </div>
              </div>
              <button className="pop-close" onClick={closePopover}>&times;</button>
            </div>

            <div className="pop-body">
              <div className="pop-field">
                <label>Aeronave</label>
                <select 
                  value={tempAeronaveId} 
                  onChange={e => setTempAeronaveId(e.target.value)}
                >
                  {aeronaves
                    .filter(a => {
                      const ocupada = safeItems.some(i => 
                        Number(i.dia_semana) === Number(activePopover.item.dia_semana) &&
                        Number(i.id_bloque) === Number(activePopover.item.id_bloque) &&
                        Number(i.id_aeronave) === Number(a.id_aeronave) &&
                        Number(i.id_detalle) !== Number(activePopover.item.id_detalle) &&
                        i.estado_vuelo !== 'CANCELADO'
                      );
                      const isVisible = a.activa !== false; 
                      return isVisible && !ocupada;
                    })
                    .map(a => (
                      <option key={a.id_aeronave} value={a.id_aeronave}>
                        {a.codigo} - {a.modelo}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="pop-field">
                <label>Instructor</label>
                <select 
                  value={tempInstructorId} 
                  onChange={e => setTempInstructorId(e.target.value)}
                >
                  {instructores.map(ins => (
                    <option key={ins.id_instructor} value={ins.id_instructor}>
                      {ins.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pop-actions">
                <button 
                  className="btn-save" 
                  onClick={handleSave}
                  disabled={loadingSave}
                >
                  {loadingSave ? <span className="pop-spinner"></span> : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
