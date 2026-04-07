import { useEffect, useState } from "react";
import Header from "../../components/Header/Header";
import AdminCalendar from "../../components/AdminCalendar/AdminCalendar";
import WebhookConfigModal from "../../components/WebhookConfigModal/WebhookConfigModal";
import HabilitarVueloModal from "../../components/HabilitarVueloModal/HabilitarVueloModal";
import AlumnoPerfilModal from "../../components/AlumnoPerfilModal/AlumnoPerfilModal";
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
  const [showWebhookModal, setShowWebhookModal] = useState(false);
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
      alert(conflicto);
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

  const confirmar = window.confirm(
    `Ese bloque ya está ocupado por ${ocupado.alumno_nombre}. ¿Querés intercambiar ambos vuelos?`
  );

  if (!confirmar) {
    setDragging(null);
    return;
  }

  const conflictoArrastrado = hayConflictoHorario(vueloArrastrado, target, [
    Number(vueloArrastrado.id_detalle),
    Number(ocupado.id_detalle),
  ]);

  if (conflictoArrastrado) {
    alert(conflictoArrastrado);
    setDragging(null);
    return;
  }

  const conflictoOcupado = hayConflictoHorario(ocupado, origen, [
    Number(vueloArrastrado.id_detalle),
    Number(ocupado.id_detalle),
  ]);

  if (conflictoOcupado) {
    alert(conflictoOcupado);
    setDragging(null);
    return;
  }

  setItems((prev) =>
    prev.map((i) => {
      if (Number(i.id_detalle) === Number(vueloArrastrado.id_detalle)) {
        return { ...i, ...target };
      }

      if (Number(i.id_detalle) === Number(ocupado.id_detalle)) {
        return {
          ...i,
          id_bloque: origen.id_bloque,
          dia_semana: origen.dia_semana,
          id_aeronave: origen.id_aeronave,
        };
      }

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
      {
        id_detalle: vueloArrastrado.id_detalle,
        ...target,
      },
      {
        id_detalle: ocupado.id_detalle,
        id_bloque: origen.id_bloque,
        dia_semana: origen.dia_semana,
        id_aeronave: origen.id_aeronave,
      },
    ];
  });

  setDragging(null);
};

  const deshacerCambios = () => {
    setItems(originalItems);
    setPendingMoves([]);
  };

const guardarCambios = async () => {
  if (pendingMoves.length === 0) {
    alert("No hay cambios para guardar");
    return;
  }

  if (!window.confirm("¿Guardar los cambios realizados?")) return;

  try {
    const resp = await guardarCambiosAdmin(pendingMoves);
    alert(resp.message || "Cambios guardados correctamente");
    load();
  } catch (e) {
    alert(e.response?.data?.message || "No se pudieron guardar los cambios");
  }
};

  const publicar = async () => {
    if (!window.confirm("¿Publicar la próxima semana?")) return;
    const resp = await publicarSemana();
    let msg = "Semana publicada";
    if (resp?.conflictos_mantenimiento?.length > 0) {
      const lista = resp.conflictos_mantenimiento
        .map((c) => `• ${c.aeronave_codigo} (${c.tipo}, programado ${c.fecha_programada?.slice(0, 10)})`)
        .join("\n");
      msg += `\n\n⚠ Aeronaves con mantenimiento pendiente que coinciden con vuelos publicados:\n${lista}\nReprogramá o cancelá manualmente.`;
    }
    alert(msg);
    load();
  };

  const onCambiarInstructor = async (id_vuelo, id_instructor_nuevo) => {
    try {
      await cambiarInstructorVuelo(id_vuelo, id_instructor_nuevo);
      await load(week);
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo cambiar el instructor");
    }
  };

  const onCancelar = async (id_vuelo) => {
    if (!window.confirm("¿Cancelar este vuelo/clase?")) return;
    try {
      await cancelarVueloAdmin(id_vuelo);
      alert("Vuelo cancelado");
      load();
    } catch (e) {
      const msg = e.response?.data?.message || "No se pudo cancelar";
      if (e.response?.status === 400) {
        const motivo = window.prompt(
          "Motivo de cancelación (obligatorio para cancelar con <24h):"
        );
        if (!motivo) return;
        try {
          await cancelarVueloAdmin(id_vuelo, motivo);
          alert("Vuelo cancelado");
          load();
        } catch (e2) {
          alert(e2.response?.data?.message || "No se pudo cancelar");
        }
        return;
      }
      alert(msg);
    }
  };

  const modeIsNext = week === "next";

  return (
    <>
      <Header />

      <div className="adm">

        <div className="adm__top">
          <div className="adm__top-left">
            <p className="adm__eyebrow">Panel de administración</p>
            <h2 className="adm__title">Gestión de horarios</h2>
            <p className="adm__subtitle">
              Programación y publicación semanal de vuelos
            </p>
          </div>
          <button
            className="adm__btn-webhook"
            onClick={() => window.location.href = "/admin/mantenimiento"}
          >
            🔧 Mantenimiento
          </button>
          <button
            className="adm__btn-webhook"
            onClick={() => window.location.href = "/admin/auditoria"}
          >
            📋 Auditoría
          </button>
          <button
            className="adm__btn-webhook"
            onClick={() => setShowAlumnoPerfil(true)}
          >
            👤 Perfiles
          </button>
          <button
            className="adm__btn-webhook"
            onClick={() => setShowVueloExtraModal(true)}
          >
            ✈ Alumnos
          </button>
          <button
            className="adm__btn-webhook"
            onClick={() => setShowWebhookModal(true)}
          >
            ⚙ Webhooks
          </button>
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
            <span
              className="adm__stat-num"
              style={{ fontSize: "0.85rem", color: "var(--adm-text-sub)" }}
            >
              {modeIsNext ? "PRÓXIMA" : "ACTUAL"}
            </span>
            <span className="adm__stat-lbl">Semana activa</span>
          </div>
        </div>

        <div className="adm__tabs">
          <button
            className={`adm__tab ${week === "current" ? "adm__tab--active" : ""}`}
            onClick={() => setWeek("current")}
          >
            Semana actual
          </button>
          <button
            className={`adm__tab ${week === "next" ? "adm__tab--active" : ""}`}
            onClick={() => setWeek("next")}
          >
            Próxima semana
          </button>
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
              handleDrop={handleDrop}
              week={week}
              onCancelar={onCancelar}
              instructores={instructores}
              onCambiarInstructor={onCambiarInstructor}
            />
          )}
        </div>

      </div>

      {showVueloExtraModal && (
        <HabilitarVueloModal onClose={() => setShowVueloExtraModal(false)} />
      )}

      {showAlumnoPerfil && (
        <AlumnoPerfilModal onClose={() => setShowAlumnoPerfil(false)} />
      )}

      <WebhookConfigModal
        open={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
      />
    </>
  );
}