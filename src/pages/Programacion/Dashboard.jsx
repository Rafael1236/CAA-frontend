import { useEffect, useState } from "react";
import Header from "../../components/Header/Header";
import {
  getAeronavesActivas,
  getBloquesHorario,
  getCalendarioProgramacion,
  guardarCambiosProgramacion,
} from "../../services/programacionApi";
import ProgramacionCalendar from "../../components/ProgramacionCalendar/ProgramacionCalendar";
import "./Dashboard.css";

export default function ProgramacionDashboard() {
  const [bloques, setBloques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [pendingMoves, setPendingMoves] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [b, a, cal] = await Promise.all([
      getBloquesHorario(),
      getAeronavesActivas(),
      getCalendarioProgramacion(),
    ]);
    setBloques(b);
    setAeronaves(a);
    setItems(cal);
    setOriginalItems(cal);
    setPendingMoves([]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const handleDrop = (target) => {
    if (!dragging) return;

    const ocupado = originalItems.some(
      (i) =>
        i.id_bloque === target.id_bloque &&
        i.dia_semana === target.dia_semana &&
        i.id_aeronave === target.id_aeronave
    );

    if (ocupado) {
      alert("Ese bloque ya está ocupado.");
      setDragging(null);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id_detalle === dragging.id_detalle
          ? { ...i, ...target }
          : i
      )
    );

    setPendingMoves((prev) => [
      ...prev.filter((p) => p.id_detalle !== dragging.id_detalle),
      { id_detalle: dragging.id_detalle, ...target },
    ]);

    setDragging(null);
  };
const semanaPublicada = items.some(
  (i) => i.estado_solicitud === "PUBLICADO"
);

  const guardarCambios = async () => {
    if (pendingMoves.length === 0) return;
    await guardarCambiosProgramacion(pendingMoves);
    await reload();
  };

  const deshacerCambios = () => {
    setItems(originalItems);
    setPendingMoves([]);
  };

  return (
    <>
  <Header />

  <div className="prog-page">
    <h2>Programación – Calendario</h2>
    <p className="prog-subtitle">
      Próxima semana • arrastrá vuelos para reorganizar
    </p>

    <div className="prog-section">
      <div className="prog-section__header">
        <div>
          <h3 className="prog-section__title">Horario semanal</h3>
          <p className="prog-section__hint">
            Lunes a sábado • bloques por hora
          </p>
        </div>

        <div className="prog-actions">
          <button onClick={reload}>Refrescar</button>
          <button onClick={deshacerCambios} disabled={!pendingMoves.length}>
            Deshacer
          </button>
          <button
            className="btn-save"
            onClick={guardarCambios}
            disabled={pendingMoves.length === 0 || semanaPublicada}
          >
            Guardar cambios ({pendingMoves.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <ProgramacionCalendar
          bloques={bloques}
          aeronaves={aeronaves}
          items={items}
          pendingMoves={pendingMoves}
          setDragging={setDragging}
          handleDrop={handleDrop}
          semanaPublicada={semanaPublicada}
        />
      )}
    </div>
  </div>
</>

  );
}
