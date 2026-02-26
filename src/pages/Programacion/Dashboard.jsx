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

  const [bloques, setBloques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);

  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [pendingMoves, setPendingMoves] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    reload();
  }, [week]);

  const handleDrop = (target) => {
    if (!dragging) return;

    if (week !== "next") {
      setDragging(null);
      return;
    }

    if (
      dragging.id_bloque === target.id_bloque &&
      dragging.dia_semana === target.dia_semana &&
      dragging.id_aeronave === target.id_aeronave
    ) {
      setDragging(null);
      return;
    }

    const ocupado = items.some(
      (i) =>
        i.id_bloque === target.id_bloque &&
        i.dia_semana === target.dia_semana &&
        i.id_aeronave === target.id_aeronave &&
        i.id_detalle !== dragging.id_detalle
    );

    if (ocupado) {
      alert("Ese bloque ya está ocupado.");
      setDragging(null);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id_detalle === dragging.id_detalle ? { ...i, ...target } : i
      )
    );

    setPendingMoves((prev) => [
      ...prev.filter((p) => p.id_detalle !== dragging.id_detalle),
      { id_detalle: dragging.id_detalle, ...target },
    ]);

    setDragging(null);
  };

  const semanaPublicadaNext =
    week === "next" && items.some((i) => i.estado_solicitud === "PUBLICADO");

  const guardarCambios = async () => {
    if (week !== "next") return;
    if (pendingMoves.length === 0) return;
    await guardarCambiosProgramacion(pendingMoves);
    await reload();
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

  return (
    <>
      <Header />

      <div className="prog-page">
        <h2>Programación – Calendario</h2>

        <WeekSelector selected={week} onChange={setWeek} />

        <div className="prog-section">
          <div className="prog-section__header">
            <div>
              <h3 className="prog-section__title">Horario semanal</h3>
              <p className="prog-section__hint">
                {week === "next"
                  ? "Próxima semana • arrastrá vuelos para reorganizar"
                  : "Semana actual • solo cancelaciones"}
              </p>
            </div>

            <div className="prog-actions">
              <button onClick={reload}>Refrescar</button>

              {week === "next" && (
                <>
                  <button
                    onClick={deshacerCambios}
                    disabled={!pendingMoves.length}
                  >
                    Deshacer
                  </button>

                  <button
                    className="btn-save"
                    onClick={guardarCambios}
                    disabled={pendingMoves.length === 0 || semanaPublicadaNext}
                  >
                    Guardar cambios ({pendingMoves.length})
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <p>Cargando…</p>
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