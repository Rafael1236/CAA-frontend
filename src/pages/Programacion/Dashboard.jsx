import { useEffect, useState } from "react";
import { toast } from "sonner";
import Header from "../../components/Header/Header";
import {
  getAeronavesActivas,
  getBloquesHorario,
  getCalendarioProgramacion,
  guardarCambiosProgramacion,
  getBloquesBloqueados,
  getAeronavesDisponibles,
} from "../../services/programacionApi";

import AdminCalendar from "../../components/AdminCalendar/AdminCalendar";
import { getInstructoresActivos, cambiarInstructorVuelo } from "../../services/adminApi";
import "./Dashboard.css";

// ── Modal reasignar aeronave ──────────────────────────────────────────────
function ReasignarAeronaveModal({ vuelo, onClose, onReasignado }) {
  const [disponibles, setDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAeronavesDisponibles(vuelo.id_semana, vuelo.id_bloque, vuelo.dia_semana)
      .then((d) => { setDisponibles(d); if (d.length > 0) setSelected(d[0].id_aeronave); })
      .catch(() => setError("Error al cargar aeronaves disponibles"))
      .finally(() => setLoading(false));
  }, [vuelo.id_semana, vuelo.id_bloque, vuelo.dia_semana]);

  const handleGuardar = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      // Note: ReasignarAeronave is not imported, assuming it's part of programacionApi or similar
      // but the original code had 'reasignarAeronave(vuelo.id_vuelo, selected)'
      // I'll keep the logic but fix the missing import if I find it.
      // For now, I'll use the existing pattern in the project.
      const { reasignarAeronave } = await import("../../services/programacionApi");
      await reasignarAeronave(vuelo.id_vuelo, selected);
      onReasignado();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Error al reasignar");
      setSaving(false);
    }
  };

  const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  return (
    <div className="popover-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flight-popover" style={{ position: 'relative', width: '400px' }}>
        <div className="pop-header">
          <div className="pop-alumno">Reasignar aeronave — {vuelo.alumno_nombre}</div>
          <button className="pop-close" onClick={onClose}>×</button>
        </div>

        <div className="pop-body">
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: '0 0 16px 0' }}>
            {DIAS[vuelo.dia_semana]} · bloque {vuelo.id_bloque}
          </p>

          {loading ? (
            <div className="prog__loading">Cargando aeronaves…</div>
          ) : disponibles.length === 0 ? (
            <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>No hay aeronaves disponibles para este bloque.</p>
          ) : (
            <div className="pop-field">
              <label>Aeronave disponible</label>
              <select
                value={selected ?? ""}
                onChange={(e) => setSelected(Number(e.target.value))}
              >
                {disponibles.map((a) => (
                  <option key={a.id_aeronave} value={a.id_aeronave}>
                    {a.codigo} — {a.modelo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 8 }}>{error}</p>}

          <div className="pop-actions">
            <button className="btn-save" onClick={handleGuardar} disabled={saving || !selected || disponibles.length === 0}>
              {saving ? "Guardando…" : "Reasignar"}
            </button>
            <button className="btn-cancel-v" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgramacionDashboard() {
  const [week, setWeek] = useState("next");

  const [bloques, setBloques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [pendingMoves, setPendingMoves] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalReasignar, setModalReasignar] = useState(null);
  const [instructores, setInstructores] = useState([]);

  const reload = async () => {
    setLoading(true);
    try {
      const [b, a, cal, blq, ins] = await Promise.all([
        getBloquesHorario(),
        getAeronavesActivas(),
        getCalendarioProgramacion(week),
        getBloquesBloqueados(),
        getInstructoresActivos().catch(() => []),
      ]);
      setBloques(Array.isArray(b) ? b : []);
      setAeronaves(Array.isArray(a) ? a : []);
      setItems(Array.isArray(cal) ? cal : []);
      setOriginalItems(Array.isArray(cal) ? cal : []);
      setBloqueos(Array.isArray(blq) ? blq : []);
      setInstructores(Array.isArray(ins) ? ins : []);
      setPendingMoves([]);
      setDragging(null);
    } catch (e) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [week]);

  const handleDrop = (target) => {
    if (!dragging) return;
    if (week !== "next") {
      setDragging(null);
      return;
    }

    const idDragging = Number(dragging.id_detalle);
    const draggingItem = items.find(i => Number(i.id_detalle) === idDragging);
    if (!draggingItem) return;

    const destino = {
      id_bloque: Number(target.id_bloque),
      dia_semana: Number(target.dia_semana),
      id_aeronave: Number(target.id_aeronave),
    };

    // Validations
    const conflictoAlumno = items.find(i => 
      Number(i.id_alumno) === Number(draggingItem.id_alumno) &&
      Number(i.id_bloque) === destino.id_bloque &&
      Number(i.dia_semana) === destino.dia_semana &&
      Number(i.id_detalle) !== idDragging &&
      i.estado_vuelo !== 'CANCELADO'
    );
    if (conflictoAlumno) {
      toast.error(`Conflicto: ${draggingItem.alumno_nombre} ya tiene un vuelo en este bloque.`);
      setDragging(null);
      return;
    }

    const conflictoInstructor = items.find(i => 
      Number(i.id_instructor) === Number(draggingItem.id_instructor) &&
      Number(i.id_bloque) === destino.id_bloque &&
      Number(i.dia_semana) === destino.dia_semana &&
      Number(i.id_detalle) !== idDragging &&
      i.estado_vuelo !== 'CANCELADO'
    );
    if (conflictoInstructor) {
      toast.error(`Conflicto: El instructor ya tiene un vuelo en este bloque.`);
      setDragging(null);
      return;
    }

    const ocupado = items.find(
      (i) =>
        Number(i.id_bloque) === destino.id_bloque &&
        Number(i.dia_semana) === destino.dia_semana &&
        Number(i.id_aeronave) === destino.id_aeronave &&
        Number(i.id_detalle) !== idDragging &&
        i.estado_vuelo !== 'CANCELADO'
    );

    const ejecutarMovimiento = (newDest) => {
      setItems((prev) =>
        prev.map((i) =>
          Number(i.id_detalle) === idDragging
            ? { ...i, ...newDest }
            : i
        )
      );
      setPendingMoves((prev) => [
        ...prev.filter((p) => Number(p.id_detalle) !== idDragging),
        { id_detalle: idDragging, ...newDest },
      ]);
      setDragging(null);
    };

    if (!ocupado) {
      ejecutarMovimiento(destino);
      return;
    }

    // Handle occupancy
    const idOcupado = Number(ocupado.id_detalle);
    toast(`La aeronave ${ocupado.aeronave_codigo} está ocupada.`, {
      description: "¿Qué deseas hacer?",
      action: {
        label: `Intercambiar con ${ocupado.alumno_nombre}`,
        onClick: () => {
          setItems((prev) =>
            prev.map((i) => {
              const id = Number(i.id_detalle);
              if (id === idDragging) return { ...i, ...destino };
              if (id === idOcupado) return { ...i, id_bloque: draggingItem.id_bloque, dia_semana: draggingItem.dia_semana, id_aeronave: draggingItem.id_aeronave };
              return i;
            })
          );
          setPendingMoves((prev) => [
            ...prev.filter((p) => Number(p.id_detalle) !== idDragging && Number(p.id_detalle) !== idOcupado),
            { id_detalle: idDragging, ...destino },
            { id_detalle: idOcupado, id_bloque: draggingItem.id_bloque, dia_semana: draggingItem.dia_semana, id_aeronave: draggingItem.id_aeronave },
          ]);
          setDragging(null);
        }
      },
      cancel: { label: "Cancelar", onClick: () => setDragging(null) },
      duration: 15000,
    });

    setDragging(null);
  };

  const handleGuardarCambios = () => {
    if (week !== "next" || pendingMoves.length === 0) return;

    toast("¿Guardar los cambios realizados?", {
      action: {
        label: "Guardar",
        onClick: async () => {
          try {
            await guardarCambiosProgramacion(pendingMoves);
            toast.success("Cambios guardados correctamente");
            await reload();
          } catch (e) {
            toast.error(e.response?.data?.message || "No se pudieron guardar los cambios");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => { } },
    });
  };

  const deshacerCambios = () => {
    if (week !== "next") return;
    setItems(originalItems);
    setPendingMoves([]);
  };

  const onCambiarInstructor = async (id_detalle, id_instructor_nuevo) => {
    try {
      await cambiarInstructorVuelo(id_detalle, id_instructor_nuevo);
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.message || "No se pudo cambiar el instructor");
    }
  };

  const onGuardarCambio = async (moves) => {
    try {
      await guardarCambiosProgramacion(moves);
      toast.success("Cambio guardado correctamente");
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.message || "Error al guardar cambio");
      throw e;
    }
  };

  const modeIsNext = week === "next";

  return (
    <>
      <Header />
      <div className="prog">
        <div className="adm__header-modern">
          <div>
            <div className="adm__eyebrow">MÓDULO DE OPERACIONES</div>
            <h2 className="adm__title">Gestión de Programación</h2>
            <p className="adm__subtitle">
              {modeIsNext
                ? "Semana entrante: Ajuste y optimización de flota y recursos"
                : "Semana en curso: Monitoreo y ajustes de última hora"}
            </p>
          </div>
        </div>

        <div className="prog__stats">
          <div className="prog__stat">
            <span className="prog__stat-num">{items.length}</span>
            <span className="prog__stat-lbl">Vuelos Programados</span>
          </div>
          <div className="prog__stat">
            <span className="prog__stat-num">{aeronaves.length}</span>
            <span className="prog__stat-lbl">Aeronaves Activas</span>
          </div>
          <div className="prog__stat">
            <span className="prog__stat-num">{pendingMoves.length}</span>
            <span className="prog__stat-lbl">Cambios Pendientes</span>
          </div>
        </div>

        <div className="prog__section">
          <div className="prog__section-header">
            <div>
              <h3 className="prog__section-title">Calendario Semanal</h3>
              <p className="prog__section-hint">
                Arrastra los vuelos o usa el selector para reorganizar la flota
              </p>
            </div>

            <div className="prog__actions">
              <div className="adm__week-selector" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                <button
                  className="adm__week-btn"
                  style={{
                    background: week === 'current' ? 'white' : 'transparent',
                    boxShadow: week === 'current' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                    color: week === 'current' ? '#1B365D' : '#64748b',
                    border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                  }}
                  onClick={() => setWeek("current")}
                >
                  Actual
                </button>
                <button
                  className="adm__week-btn"
                  style={{
                    background: week === 'next' ? 'white' : 'transparent',
                    boxShadow: week === 'next' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                    color: week === 'next' ? '#1B365D' : '#64748b',
                    border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                  }}
                  onClick={() => setWeek("next")}
                >
                  Próxima
                </button>
              </div>

              {week === "next" && (
                <>
                  <button
                    className="prog__btn"
                    onClick={deshacerCambios}
                    disabled={pendingMoves.length === 0}
                  >
                    Deshacer
                  </button>
                  <button
                    className="prog__btn prog__btn--save"
                    onClick={handleGuardarCambios}
                    disabled={pendingMoves.length === 0}
                  >
                    Guardar {pendingMoves.length > 0 && `(${pendingMoves.length})`}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="prog__calendar-container">
            {loading ? (
              <div className="prog__loading" style={{ padding: '100px 0', textAlign: 'center', width: '100%' }}>
                <div className="pop-spinner" style={{ width: 40, height: 40, borderTopColor: '#1B365D', borderLeftColor: '#1B365D' }}></div>
                <p style={{ marginTop: 16 }}>Sincronizando calendario operativo...</p>
              </div>
            ) : (
              <AdminCalendar
                bloques={bloques}
                items={items}
                pendingMoves={pendingMoves}
                bloqueos={bloqueos}
                dragging={dragging}
                setDragging={setDragging}
                handleDrop={handleDrop}
                week={week}
                instructores={instructores}
                onCambiarInstructor={onCambiarInstructor}
                onRefresh={() => reload()}
                aeronaves={aeronaves}
                onGuardarCambio={onGuardarCambio}
              />
            )}
          </div>
        </div>
      </div>

      {modalReasignar && (
        <ReasignarAeronaveModal
          vuelo={modalReasignar}
          onClose={() => setModalReasignar(null)}
          onReasignado={reload}
        />
      )}

      <style>{`
        [draggable] { -webkit-user-drag: element; user-select: none; }
        .sonner-toast { font-family: 'Outfit', sans-serif !important; border-radius: 12px !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}