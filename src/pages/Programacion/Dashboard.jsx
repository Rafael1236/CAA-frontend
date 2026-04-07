import { useEffect, useState } from "react";
import WeekSelector from "../../components/WeekSelector/WeekSelector";
import Header from "../../components/Header/Header";
import {
  getAeronavesActivas,
  getBloquesHorario,
  getCalendarioProgramacion,
  guardarCambiosProgramacion,
  getBloquesBloqueados,
  cancelarVueloProgramacion,
} from "../../services/programacionApi";

import ProgramacionCalendar from "../../components/ProgramacionCalendar/ProgramacionCalendar";
import "./Dashboard.css";

export default function ProgramacionDashboard() {
  const [week, setWeek] = useState("next");

  const [bloques, setBloques]           = useState([]);
  const [aeronaves, setAeronaves]       = useState([]);
  const [bloqueos, setBloqueos]         = useState([]);
  const [items, setItems]               = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [pendingMoves, setPendingMoves] = useState([]);
  const [dragging, setDragging]         = useState(null);
  const [loading, setLoading]           = useState(true);

  const reload = async () => {
    setLoading(true);
    const [b, a, cal, blq] = await Promise.all([
      getBloquesHorario(),
      getAeronavesActivas(),
      getCalendarioProgramacion(week),
      getBloquesBloqueados(),
    ]);
    setBloques(Array.isArray(b) ? b : []);
    setAeronaves(Array.isArray(a) ? a : []);
    setItems(Array.isArray(cal) ? cal : []);
    setOriginalItems(Array.isArray(cal) ? cal : []);
    setBloqueos(Array.isArray(blq) ? blq : []);
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

  const confirmar = window.confirm(
    `Ese bloque ya está ocupado por ${ocupado.alumno_nombre || ocupado.nombre || "otro vuelo"}. ¿Querés intercambiar ambos vuelos?`
  );

  if (!confirmar) {
    setDragging(null);
    return;
  }

  setItems((prev) =>
    prev.map((i) => {
      const id = Number(i.id_detalle);

      if (id === idDragging) {
        return { ...i, ...destino };
      }

      if (id === idOcupado) {
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
    const sinAmbos = prev.filter((p) => {
      const id = Number(p.id_detalle);
      return id !== idDragging && id !== idOcupado;
    });

    const nuevos = [
      ...sinAmbos,
      {
        id_detalle: idDragging,
        ...destino,
      },
      {
        id_detalle: idOcupado,
        id_bloque: origen.id_bloque,
        dia_semana: origen.dia_semana,
        id_aeronave: origen.id_aeronave,
      },
    ];

    console.log("PENDING MOVES FINAL:", nuevos);
    return nuevos;
  });

  setDragging(null);
};

  const semanaPublicadaNext =
    week === "next" && items.some((i) => i.estado_solicitud === "PUBLICADO");

const guardarCambios = async () => {
  if (week !== "next") return;

  if (pendingMoves.length === 0) {
    alert("No hay cambios para guardar");
    return;
  }

  if (!window.confirm("¿Guardar los cambios realizados?")) return;

  console.log("PENDING MOVES ENVIADOS:", pendingMoves);

  try {
    const resp = await guardarCambiosProgramacion(pendingMoves);
    alert(resp.message || "Cambios guardados correctamente");
    await reload();
  } catch (e) {
    alert(e.response?.data?.message || "No se pudieron guardar los cambios");
  }
};

  const deshacerCambios = () => {
    if (week !== "next") return;
    setItems(originalItems);
    setPendingMoves([]);
  };

  const onCancelar = async (id_vuelo) => {
    if (week !== "current") return;
    if (!window.confirm("¿Cancelar esta clase?")) return;
    try {
      await cancelarVueloProgramacion(id_vuelo);
      alert("Clase cancelada");
      await reload();
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo cancelar");
    }
  };

  const modeIsNext = week === "next";

  return (
    <>
      <Header />
      <div className="prog">
        <div className="prog__top">
          <div className="prog__top-left">
            <p className="prog__eyebrow">Usuario de programación</p>
            <h2 className="prog__title">Calendario semanal</h2>
            <p className="prog__subtitle">
              {modeIsNext
                ? "Próxima semana · arrastrá vuelos para reorganizar"
                : "Semana actual · solo cancelaciones disponibles"}
            </p>
          </div>

          <div className="prog__top-right">
            <WeekSelector selected={week} onChange={setWeek} />
          </div>
        </div>

        <div className="prog__stats">
          <div className="prog__stat">
            <span className="prog__stat-num">{items.length}</span>
            <span className="prog__stat-lbl">Vuelos en calendario</span>
          </div>
          <div className="prog__stat">
            <span className="prog__stat-num">{aeronaves.length}</span>
            <span className="prog__stat-lbl">Aeronaves activas</span>
          </div>
          <div className="prog__stat">
            <span
              className="prog__stat-num"
              style={{ color: pendingMoves.length > 0 ? "var(--gold)" : "var(--teal)" }}
            >
              {pendingMoves.length}
            </span>
            <span className="prog__stat-lbl">Cambios pendientes</span>
          </div>
          <div className="prog__stat">
            <span className="prog__stat-num" style={{ fontSize: "0.85rem", color: "var(--text-sub)" }}>
              {modeIsNext ? "PRÓXIMA" : "ACTUAL"}
            </span>
            <span className="prog__stat-lbl">Semana activa</span>
          </div>
        </div>

        <div className="prog__section">
          <div className="prog__section-header">
            <div className="prog__section-info">
              <h3 className="prog__section-title">Horario semanal</h3>
              <p className="prog__section-hint">
                {modeIsNext
                  ? "Arrastrá y soltá para mover vuelos entre bloques"
                  : "Semana en curso · podés cancelar clases individuales"}
              </p>
            </div>

            <div className="prog__actions">
              <button className="prog__btn" onClick={reload}>
                ↻ Refrescar
              </button>

              {modeIsNext && (
                <>
                  <button
                    className="prog__btn"
                    onClick={deshacerCambios}
                    disabled={!pendingMoves.length}
                  >
                    ✕ Deshacer
                  </button>

                  <button
                    className="prog__btn prog__btn--save"
                    onClick={guardarCambios}
                    disabled={pendingMoves.length === 0 || semanaPublicadaNext}
                  >
                    ✓ Guardar ({pendingMoves.length})
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="prog__loading">
              <span className="prog__loading-dot" />
              <span className="prog__loading-dot" />
              <span className="prog__loading-dot" />
              Cargando calendario…
            </div>
          ) : (
            <ProgramacionCalendar
              week={week}
              bloques={bloques}
              aeronaves={aeronaves}
              items={items}
              originalItems={originalItems}
              pendingMoves={pendingMoves}
              bloqueos={bloqueos}
              setDragging={setDragging}
              handleDrop={handleDrop}
              onCancelar={onCancelar}
            />
          )}
        </div>

      </div>
    </>
  );
}