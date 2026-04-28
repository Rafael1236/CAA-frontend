import { useEffect, useState } from "react";
import { toast } from "sonner";
import WeekSelector from "../../components/WeekSelector/WeekSelector";
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
import "../../components/AdminLayout/AdminLayout.css";
import "../../pages/Admin/Dashboard.css";

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
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "1rem",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#1a1f2e", borderRadius: 12, padding: "1.5rem",
        minWidth: 360, maxWidth: 480, width: "100%",
        border: "1px solid #2a3150",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#e2e8f0" }}>
            Reasignar aeronave — {vuelo.alumno_nombre}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>

        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {DIAS[vuelo.dia_semana]} · bloque {vuelo.id_bloque}
        </p>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Cargando aeronaves…</p>
        ) : disponibles.length === 0 ? (
          <p style={{ color: "#f87171" }}>No hay aeronaves disponibles para este bloque.</p>
        ) : (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", marginBottom: 6 }}>
              Aeronave disponible
            </label>
            <select
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 7,
                border: "1px solid #2a3150", background: "#0f1420", color: "#e2e8f0",
                fontSize: "0.9rem",
              }}
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

        {error && <p style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid #2a3150", background: "transparent", color: "#94a3b8", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving || !selected || disponibles.length === 0}
            style={{
              padding: "7px 16px", borderRadius: 7, border: "none",
              background: "#1e3a5f", color: "#fff", cursor: "pointer",
              opacity: (saving || !selected) ? 0.5 : 1,
            }}
          >
            {saving ? "Guardando…" : "Reasignar"}
          </button>
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
    setLoading(false);
  };

  useEffect(() => { reload(); }, [week]);

  const handleDrop = (target) => {
    if (!dragging) return;
    if (week !== "next") {
      setDragging(null);
      return;
    }

    const origen = {
      id_bloque: Number(dragging.id_bloque),
      dia_semana: Number(dragging.dia_semana),
      id_aeronave: Number(dragging.id_aeronave),
    };

    const destino = {
      id_bloque: Number(target.id_bloque),
      dia_semana: Number(target.dia_semana),
      id_aeronave: Number(target.id_aeronave),
    };

    const idDragging = Number(dragging.id_detalle);

    if (
      origen.id_bloque === destino.id_bloque &&
      origen.dia_semana === destino.dia_semana &&
      origen.id_aeronave === destino.id_aeronave
    ) {
      setDragging(null);
      return;
    }

    const ocupado = items.find(
      (i) =>
        Number(i.id_bloque) === destino.id_bloque &&
        Number(i.dia_semana) === destino.dia_semana &&
        Number(i.id_aeronave) === destino.id_aeronave &&
        Number(i.id_detalle) !== idDragging
    );

    if (!ocupado) {
      setItems((prev) =>
        prev.map((i) =>
          Number(i.id_detalle) === idDragging
            ? { ...i, ...destino }
            : i
        )
      );

      setPendingMoves((prev) => {
        const nuevos = [
          ...prev.filter((p) => Number(p.id_detalle) !== idDragging),
          { id_detalle: idDragging, ...destino },
        ];

        console.log("PENDING MOVES FINAL:", nuevos);
        return nuevos;
      });

      setDragging(null);
      return;
    }

    const idOcupado = Number(ocupado.id_detalle);

    toast(`¿Intercambiar con ${ocupado.alumno_nombre || ocupado.nombre || "otro vuelo"}?`, {
      action: {
        label: "Intercambiar",
        onClick: () => {
          setItems((prev) =>
            prev.map((i) => {
              const id = Number(i.id_detalle);
              if (id === idDragging) return { ...i, ...destino };
              if (id === idOcupado) return { ...i, id_bloque: origen.id_bloque, dia_semana: origen.dia_semana, id_aeronave: origen.id_aeronave };
              return i;
            })
          );
          setPendingMoves((prev) => {
            const sinAmbos = prev.filter((p) => {
              const id = Number(p.id_detalle);
              return id !== idDragging && id !== idOcupado;
            });
            return [
              ...sinAmbos,
              { id_detalle: idDragging, ...destino },
              { id_detalle: idOcupado, id_bloque: origen.id_bloque, dia_semana: origen.dia_semana, id_aeronave: origen.id_aeronave },
            ];
          });
        },
      },
      cancel: { label: "Cancelar", onClick: () => { } },
      duration: 10000,
    });

    setDragging(null);
  };

  const semanaPublicadaNext =
    week === "next" && items.some((i) => i.estado_solicitud === "PUBLICADO");

  const guardarCambios = () => {
    if (week !== "next") return;

    if (pendingMoves.length === 0) {
      toast.warning("No hay cambios para guardar");
      return;
    }

    const movesSnapshot = [...pendingMoves];
    toast("¿Guardar los cambios realizados?", {
      action: {
        label: "Guardar",
        onClick: async () => {
          try {
            const resp = await guardarCambiosProgramacion(movesSnapshot);
            toast.success(resp.message || "Cambios guardados correctamente");
            await reload();
          } catch (e) {
            toast.error(e.response?.data?.message || "No se pudieron guardar los cambios");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => { } },
      duration: 10000,
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
      <div className="adm" style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: 'calc(100vh - 60px)',
        padding: '40px 24px',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          <div className="adm__header-modern" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
          }}>
            <div>
              <div className="adm__eyebrow" style={{ color: '#C53030', fontWeight: 800 }}>MÓDULO DE OPERACIONES</div>
              <h2 className="adm__title" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#1B365D' }}>Gestión de Programación</h2>
              <p className="adm__subtitle" style={{ fontSize: '1.1rem', opacity: 0.8 }}>
                {modeIsNext
                  ? "Semana entrante: Ajuste y optimización de flota y recursos"
                  : "Semana en curso: Monitoreo y ajustes de última hora"}
              </p>
            </div>
          </div>

          <div className="adm__stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            <div className="adm__stat" style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 10px 30px rgba(27, 54, 93, 0.1)',
              padding: '24px',
              borderRadius: '20px',
              transition: 'transform 0.3s ease'
            }}>
              <div className="adm__stat-header" style={{ marginBottom: '12px' }}>
                <span className="adm__stat-lbl" style={{ color: '#64748b', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Vuelos Programados</span>
                <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-calendar-check" style={{ color: '#1B365D', fontSize: '1.2rem' }}></i>
                </div>
              </div>
              <span className="adm__stat-num" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1B365D' }}>{items.length}</span>
              <div style={{ height: '4px', width: '60px', background: '#1B365D', marginTop: '8px', borderRadius: '2px' }}></div>
            </div>

            <div className="adm__stat" style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 10px 30px rgba(27, 54, 93, 0.1)',
              padding: '24px',
              borderRadius: '20px'
            }}>
              <div className="adm__stat-header" style={{ marginBottom: '12px' }}>
                <span className="adm__stat-lbl" style={{ color: '#64748b', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Aeronaves Activas</span>
                <div style={{ width: '40px', height: '40px', background: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-airplane" style={{ color: '#d97706', fontSize: '1.2rem' }}></i>
                </div>
              </div>
              <span className="adm__stat-num" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d97706' }}>{aeronaves.length}</span>
              <div style={{ height: '4px', width: '60px', background: '#d97706', marginTop: '8px', borderRadius: '2px' }}></div>
            </div>

            <div className="adm__stat" style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 10px 30px rgba(27, 54, 93, 0.1)',
              padding: '24px',
              borderRadius: '20px'
            }}>
              <div className="adm__stat-header" style={{ marginBottom: '12px' }}>
                <span className="adm__stat-lbl" style={{ color: '#64748b', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Cambios Pendientes</span>
                <div style={{ width: '40px', height: '40px', background: '#fee2e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-clock-history" style={{ color: '#ef4444', fontSize: '1.2rem' }}></i>
                </div>
              </div>
              <span className="adm__stat-num" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ef4444' }}>{pendingMoves.length}</span>
              <div style={{ height: '4px', width: '60px', background: '#ef4444', marginTop: '8px', borderRadius: '2px' }}></div>
            </div>

            <div className="adm__stat" style={{
              background: 'linear-gradient(135deg, #1B365D 0%, #102a43 100%)',
              color: 'white',
              padding: '24px',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(27, 54, 93, 0.3)'
            }}>
              <div className="adm__stat-header" style={{ marginBottom: '12px' }}>
                <span className="adm__stat-lbl" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Estado de Semana</span>
                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-calendar-week" style={{ color: 'white', fontSize: '1.2rem' }}></i>
                </div>
              </div>
              <span className="adm__stat-num" style={{ fontSize: '2.2rem', fontWeight: 900 }}>
                {modeIsNext ? "PRÓXIMA" : "ACTUAL"}
              </span>
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Control de operaciones activo</p>
            </div>
          </div>

          <div className="adm__section" style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(27, 54, 93, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden'
          }}>
            <div className="adm__section-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 32px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-calendar3" style={{ color: '#1B365D', fontSize: '1.4rem' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Planificación Operativa</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Arrastre y suelte para reorganizar vuelos y aeronaves</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div className="adm__week-selector-premium" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#edf2f7', padding: '6px', borderRadius: '12px' }}>
                  <button
                    onClick={() => setWeek("current")}
                    disabled={week === "current"}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: week === 'current' ? 'white' : 'transparent',
                      boxShadow: week === 'current' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                      color: week === 'current' ? '#1B365D' : '#64748b',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Semana Actual
                  </button>
                  <button
                    onClick={() => setWeek("next")}
                    disabled={week === "next"}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: week === 'next' ? 'white' : 'transparent',
                      boxShadow: week === 'next' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                      color: week === 'next' ? '#1B365D' : '#64748b',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Semana Próxima
                  </button>
                </div>

                <div className="adm__actions-premium" style={{ display: 'flex', gap: '12px' }}>
                  <button className="adm__btn-premium" onClick={reload} style={{
                    background: 'white',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}>
                    <i className="bi bi-arrow-clockwise"></i>
                    Refrescar
                  </button>

                  {modeIsNext && pendingMoves.length > 0 && (
                    <>
                      <button
                        onClick={deshacerCambios}
                        style={{
                          background: '#fff5f5',
                          color: '#c53030',
                          border: '1px solid #feb2b2',
                          borderRadius: '12px',
                          padding: '10px 18px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        Deshacer
                      </button>
                      <button
                        onClick={guardarCambios}
                        style={{
                          background: '#1B365D',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px 24px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          boxShadow: '0 10px 20px rgba(27, 54, 93, 0.2)'
                        }}
                      >
                        Guardar Cambios ({pendingMoves.length})
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '32px' }}>
              {loading ? (
                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                  <div className="adm__spinner" style={{
                    width: '50px',
                    height: '50px',
                    border: '5px solid #e2e8f0',
                    borderTopColor: '#1B365D',
                    borderRadius: '50%',
                    margin: '0 auto 20px',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <p style={{ color: '#64748b', fontWeight: 600 }}>Sincronizando calendario operativo...</p>
                </div>
              ) : (
                <AdminCalendar
                  bloques={bloques}
                  aeronaves={aeronaves}
                  items={items}
                  pendingMoves={pendingMoves}
                  bloqueos={bloqueos}
                  setDragging={setDragging}
                  dragging={dragging}
                  handleDrop={handleDrop}
                  week={week}
                  instructores={instructores}
                  onCambiarInstructor={onCambiarInstructor}
                  onGuardarCambio={onGuardarCambio}
                  onRefresh={() => reload()}
                />
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .adm__stat:hover {
            transform: translateY(-5px);
          }
          .adm__btn-premium:hover {
            background: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
          }
        `}</style>
      </div>
      {modalReasignar && (
        <ReasignarAeronaveModal
          vuelo={modalReasignar}
          onClose={() => setModalReasignar(null)}
          onReasignado={reload}
        />
      )}
    </>
  );
}