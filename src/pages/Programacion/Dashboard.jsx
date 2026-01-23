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

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

const formatHora = (h) => h?.slice(0, 5);

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
        <div className="prog-container">
          <h2>Programación – Calendario (Próxima semana)</h2>

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
            />
          )}

          <div className="prog-actions">
            <button onClick={reload}>Refrescar</button>
            <button onClick={deshacerCambios} disabled={!pendingMoves.length}>
              Deshacer
            </button>
            <button
              className="btn-save"
              onClick={guardarCambios}
              disabled={!pendingMoves.length}
            >
              Guardar cambios ({pendingMoves.length})
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
