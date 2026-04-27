import { useEffect, useState } from "react";
import { toast } from "sonner";
import ToastMantenimiento from "../../components/ToastMantenimiento/ToastMantenimiento";
import TickerBar from "../../components/TickerBar/TickerBar";
import AdminCalendar from "../../components/AdminCalendar/AdminCalendar";
import {
  getCalendarioAdmin,
  getAeronavesActivasAdmin,
  getBloquesHorario,
  guardarCambiosAdmin,
  publicarSemana,
  getBloquesBloqueadosAdmin as getBloquesBloqueados,
  cancelarVueloAdmin,
  getInstructoresActivos,
  cambiarInstructorVuelo,
} from "../../services/adminApi";
import "./Dashboard.css";

export default function AdminDashboard() {
  const [week, setWeek]                   = useState("next");
  const [bloques, setBloques]             = useState([]);
  const [aeronaves, setAeronaves]         = useState([]);
  const [items, setItems]                 = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [pendingMoves, setPendingMoves]   = useState([]);
  const [dragging, setDragging]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [bloqueos, setBloqueos]           = useState([]);
  const [showVueloExtraModal, setShowVueloExtraModal] = useState(false);
  const [showAlumnoPerfil, setShowAlumnoPerfil] = useState(false);
  const [instructores, setInstructores] = useState([]);

  const load = async (w = week) => {
    setLoading(true);
    try {
      const [b, a, cal, blq] = await Promise.all([
        getBloquesHorario(),
        getAeronavesActivasAdmin(),
        getCalendarioAdmin(w),
        getBloquesBloqueados(),
      ]);
      setBloques(b);
      setAeronaves(a);
      setItems(cal);
      setOriginalItems(cal);
      setBloqueos(blq);
      setPendingMoves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [week]);

  useEffect(() => {
    getInstructoresActivos().then(setInstructores).catch(() => {});
  }, []);

const handleDrop = (target) => {
  if (!dragging) return;

  const origen = {
    id_bloque: dragging.id_bloque,
    dia_semana: dragging.dia_semana,
    id_aeronave: dragging.id_aeronave,
  };

  if (
    Number(origen.id_bloque) === Number(target.id_bloque) &&
    Number(origen.dia_semana) === Number(target.dia_semana) &&
    Number(origen.id_aeronave) === Number(target.id_aeronave)
  ) {
    setDragging(null);
    return;
  }

  const vueloArrastrado = items.find(
    (i) => Number(i.id_detalle) === Number(dragging.id_detalle)
  );

  if (!vueloArrastrado) {
    setDragging(null);
    return;
  }

  const ocupado = items.find(
    (i) =>
      Number(i.id_bloque) === Number(target.id_bloque) &&
      Number(i.dia_semana) === Number(target.dia_semana) &&
      Number(i.id_aeronave) === Number(target.id_aeronave) &&
      Number(i.id_detalle) !== Number(dragging.id_detalle)
  );

  const hayConflictoHorario = (vuelo, destino, excluirIds = []) => {
    const conflictoAlumno = items.find(
      (i) =>
        !excluirIds.includes(Number(i.id_detalle)) &&
        Number(i.dia_semana) === Number(destino.dia_semana) &&
        Number(i.id_bloque) === Number(destino.id_bloque) &&
        Number(i.id_alumno) === Number(vuelo.id_alumno)
    );

    if (conflictoAlumno) {
      return "El alumno ya tiene un vuelo en ese horario";
    }

    const conflictoInstructor = items.find(
      (i) =>
        !excluirIds.includes(Number(i.id_detalle)) &&
        Number(i.dia_semana) === Number(destino.dia_semana) &&
        Number(i.id_bloque) === Number(destino.id_bloque) &&
        Number(i.id_instructor) === Number(vuelo.id_instructor)
    );

    if (conflictoInstructor) {
      return "El instructor ya tiene un vuelo en ese horario";
    }

    return null;
  };

  if (!ocupado) {
    const conflicto = hayConflictoHorario(vueloArrastrado, target, [
      Number(vueloArrastrado.id_detalle),
    ]);

    if (conflicto) {
      toast.error(conflicto);
      setDragging(null);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        Number(i.id_detalle) === Number(dragging.id_detalle)
          ? { ...i, ...target }
          : i
      )
    );

    setPendingMoves((prev) => [
      ...prev.filter((m) => Number(m.id_detalle) !== Number(dragging.id_detalle)),
      { id_detalle: dragging.id_detalle, ...target },
    ]);

    setDragging(null);
    return;
  }

  toast(`¿Intercambiar con ${ocupado.alumno_nombre}?`, {
    action: {
      label: "Intercambiar",
      onClick: () => {
        const conflictoArrastrado = hayConflictoHorario(vueloArrastrado, target, [
          Number(vueloArrastrado.id_detalle),
          Number(ocupado.id_detalle),
        ]);
        if (conflictoArrastrado) { toast.error(conflictoArrastrado); return; }

        const conflictoOcupado = hayConflictoHorario(ocupado, origen, [
          Number(vueloArrastrado.id_detalle),
          Number(ocupado.id_detalle),
        ]);
        if (conflictoOcupado) { toast.error(conflictoOcupado); return; }

        setItems((prev) =>
          prev.map((i) => {
            if (Number(i.id_detalle) === Number(vueloArrastrado.id_detalle)) return { ...i, ...target };
            if (Number(i.id_detalle) === Number(ocupado.id_detalle)) return { ...i, id_bloque: origen.id_bloque, dia_semana: origen.dia_semana, id_aeronave: origen.id_aeronave };
            return i;
          })
        );
        setPendingMoves((prev) => {
          const sinAmbos = prev.filter(
            (m) =>
              Number(m.id_detalle) !== Number(vueloArrastrado.id_detalle) &&
              Number(m.id_detalle) !== Number(ocupado.id_detalle)
          );
          return [
            ...sinAmbos,
            { id_detalle: vueloArrastrado.id_detalle, ...target },
            { id_detalle: ocupado.id_detalle, id_bloque: origen.id_bloque, dia_semana: origen.dia_semana, id_aeronave: origen.id_aeronave },
          ];
        });
      },
    },
    cancel: { label: "Cancelar", onClick: () => {} },
    duration: 10000,
  });

  setDragging(null);
};

  const deshacerCambios = () => {
    setItems(originalItems);
    setPendingMoves([]);
  };

const guardarCambios = () => {
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
          const resp = await guardarCambiosAdmin(movesSnapshot);
          toast.success(resp.message || "Cambios guardados correctamente");
          load();
        } catch (e) {
          toast.error(e.response?.data?.message || "No se pudieron guardar los cambios");
        }
      },
    },
    cancel: { label: "Cancelar", onClick: () => {} },
    duration: 10000,
  });
};

  const publicar = () => {
    toast("¿Publicar la próxima semana?", {
      action: {
        label: "Publicar",
        onClick: async () => {
          const resp = await publicarSemana();
          toast.success("Semana publicada");
          if (resp?.conflictos_mantenimiento?.length > 0) {
            const lista = resp.conflictos_mantenimiento
              .map((c) => `${c.aeronave_codigo} (${c.tipo}, programado ${c.fecha_programada?.slice(0, 10)})`)
              .join(", ");
            toast.warning(`⚠ Aeronaves con mantenimiento pendiente: ${lista}. Reprogramá o cancelá manualmente.`, { duration: 10000 });
          }
          load();
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
      duration: 10000,
    });
  };

  const onCambiarInstructor = async (id_detalle, id_instructor_nuevo) => {
    try {
      await cambiarInstructorVuelo(id_detalle, id_instructor_nuevo);
      await load(week);
    } catch (e) {
      toast.error(e.response?.data?.message || "No se pudo cambiar el instructor");
    }
  };

  const onCancelar = (id_vuelo) => {
    toast("¿Cancelar este vuelo/clase?", {
      action: {
        label: "Cancelar vuelo",
        onClick: async () => {
          try {
            await cancelarVueloAdmin(id_vuelo);
            toast.success("Vuelo cancelado");
            load();
          } catch (e) {
            if (e.response?.status === 400) {
              let motivoInput = "";
              toast.custom((t) => (
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "1rem 1.25rem", minWidth: 320 }}>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "#f1f5f9", fontWeight: 600 }}>
                    Motivo de cancelación (obligatorio, &lt;24 h)
                  </p>
                  <input
                    autoFocus
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #475569", background: "#0f172a", color: "#f1f5f9", fontSize: "0.875rem", boxSizing: "border-box", marginBottom: "0.75rem" }}
                    placeholder="Ingresá el motivo…"
                    onChange={(ev) => { motivoInput = ev.target.value; }}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button
                      style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #475569", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}
                      onClick={() => toast.dismiss(t)}
                    >
                      Cancelar
                    </button>
                    <button
                      style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
                      onClick={async () => {
                        if (!motivoInput.trim()) return;
                        toast.dismiss(t);
                        try {
                          await cancelarVueloAdmin(id_vuelo, motivoInput.trim());
                          toast.success("Vuelo cancelado");
                          load();
                        } catch (e2) {
                          toast.error(e2.response?.data?.message || "No se pudo cancelar");
                        }
                      }}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              ), { duration: Infinity });
            } else {
              toast.error(e.response?.data?.message || "No se pudo cancelar");
            }
          }
        },
      },
      cancel: { label: "No cancelar", onClick: () => {} },
      duration: 10000,
    });
  };

  const getWeekNumber = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset * 7);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const currentWeekDisplay = week === "current" ? getWeekNumber(0) : getWeekNumber(1);
  const modeIsNext = week === "next";

  return (
    <>
      <TickerBar />
      <ToastMantenimiento />

      <div className="adm">

        <div className="adm__top">
          <div className="adm__top-left">
            <p className="adm__eyebrow">Panel de administración</p>
            <h2 className="adm__title">Gestión de horarios</h2>
            <p className="adm__subtitle">
              Programación y publicación semanal de vuelos
            </p>
          </div>
        </div>

        <div className="adm__stats">
          <div className="adm__stat">
            <span className="adm__stat-num">{items.length}</span>
            <span className="adm__stat-lbl">Vuelos en calendario</span>
          </div>
          <div className="adm__stat">
            <span className="adm__stat-num">{aeronaves.length}</span>
            <span className="adm__stat-lbl">Aeronaves activas</span>
          </div>
          <div className="adm__stat">
            <span
              className="adm__stat-num"
              style={{ color: pendingMoves.length > 0 ? "var(--adm-gold)" : "var(--adm-teal)" }}
            >
              {pendingMoves.length}
            </span>
            <span className="adm__stat-lbl">Cambios pendientes</span>
          </div>
          <div className="adm__stat">
            <span className="adm__stat-num" style={{ color: "var(--adm-red)" }}>
              {items.filter(v => v.estado_vuelo === 'CANCELADO').length}
            </span>
            <span className="adm__stat-lbl">Cancelaciones</span>
          </div>
        </div>

        <div className="adm__section">
          <div className="adm__section-header">
            <div className="adm__section-info">
              <h3 className="adm__section-title">Horario semanal</h3>
              <p className="adm__section-hint">
                {modeIsNext
                  ? "Editable · arrastrá para reorganizar · publicable"
                  : "Vista de solo lectura · podés cancelar vuelos individuales"}
              </p>
            </div>

            <div className="adm__week-selector">
              <button 
                className="adm__week-btn" 
                onClick={() => setWeek("current")}
                disabled={week === "current"}
              >
                &lt;
              </button>
              <span className="adm__week-label">Semana {currentWeekDisplay}</span>
              <button 
                className="adm__week-btn" 
                onClick={() => setWeek("next")}
                disabled={week === "next"}
              >
                &gt;
              </button>
            </div>

            {modeIsNext && (
              <div className="adm__actions">
                <button
                  className="adm__btn"
                  onClick={deshacerCambios}
                  disabled={!pendingMoves.length}
                >
                  ✕ Deshacer
                </button>
                <button
                  className="adm__btn"
                  onClick={guardarCambios}
                  disabled={pendingMoves.length === 0}
                >
                  ✓ Guardar ({pendingMoves.length})
                </button>
                <button
                  className="adm__btn adm__btn--publish"
                  onClick={publicar}
                >
                  ▲ Publicar semana
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="adm__loading">
              <span className="adm__loading-dot" />
              <span className="adm__loading-dot" />
              <span className="adm__loading-dot" />
              Cargando calendario…
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
              onCancelar={onCancelar}
              instructores={instructores}
              onCambiarInstructor={onCambiarInstructor}
              onRefresh={() => load()}
            />
          )}
        </div>

        {/* ── Cancelaciones Recientes ── */}
        {items.some(v => v.estado_vuelo === 'CANCELADO') && (
          <div className="adm__section" style={{ marginTop: '24px' }}>
            <div className="adm__section-header">
              <div className="adm__section-info">
                <h3 className="adm__section-title">Vuelos Cancelados (Recientes)</h3>
                <p className="adm__section-hint">Últimas 5 cancelaciones registradas en esta semana</p>
              </div>
            </div>
            <div className="adm__table-wrap" style={{ padding: '0 22px 22px' }}>
              <table className="adm__cancel-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Aeronave</th>
                    <th>Fecha/Hora</th>
                    <th>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .filter(v => v.estado_vuelo === 'CANCELADO')
                    .sort((a, b) => new Date(b.fecha_cancelacion || 0) - new Date(a.fecha_cancelacion || 0))
                    .slice(0, 5)
                    .map(v => (
                      <tr key={v.id_vuelo}>
                        <td>{v.alumno_nombre}</td>
                        <td><strong>{v.aeronave_codigo}</strong></td>
                        <td>{v.hora_inicio} - {v.hora_fin}</td>
                        <td>
                          <span className={`adm__cancel-badge adm__cancel-badge--${(v.tipo_cancelacion || 'NORMAL').toLowerCase()}`}>
                            {v.tipo_cancelacion || 'NORMAL'}
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}