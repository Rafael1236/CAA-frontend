import { useEffect, useState } from "react";
import Header from "../../components/Header/Header";
import AdminCalendar from "../../components/AdminCalendar/AdminCalendar";
import {
  getCalendarioAdmin,
  getAeronavesActivasAdmin,
  getBloquesHorario,
  guardarCambiosAdmin,
  publicarSemana,
} from "../../services/adminApi";
import "./Dashboard.css";

export default function AdminDashboard() {
  const [week, setWeek] = useState("next");
  const [bloques, setBloques] = useState([]);
  const [aeronaves, setAeronaves] = useState([]);
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [pendingMoves, setPendingMoves] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (w = week) => {
    setLoading(true);
    try {
      const [b, a, cal] = await Promise.all([
        getBloquesHorario(),
        getAeronavesActivasAdmin(),
        getCalendarioAdmin(w),
      ]);
      setBloques(b);
      setAeronaves(a);
      setItems(cal);
      setOriginalItems(cal);
      setPendingMoves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [week]);

  const handleDrop = (target) => {
    if (!dragging) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id_detalle === dragging.id_detalle
          ? { ...i, ...target }
          : i
      )
    );

    setPendingMoves((prev) => [
      ...prev.filter((m) => m.id_detalle !== dragging.id_detalle),
      { id_detalle: dragging.id_detalle, ...target },
    ]);

    setDragging(null);
  };

  const guardarCambios = async () => {
    if (pendingMoves.length === 0) return;
    if (!window.confirm("¿Guardar los cambios realizados?")) return;

    await guardarCambiosAdmin(pendingMoves);
    alert("Cambios guardados");
    load();
  };

  const publicar = async () => {
    if (!window.confirm("¿Publicar la próxima semana?")) return;
    await publicarSemana();
    alert("Semana publicada");
    load();
  };

return (
    <>
      <Header />

      <div className="admin-page">
        <h2>Administración – Programación</h2>
        <p className="admin-subtitle">
          Gestión de horarios y publicación semanal
        </p>

        <div className="admin-tabs">
          <button
            className={week === "current" ? "active" : ""}
            onClick={() => setWeek("current")}
          >
            Semana actual
          </button>
          <button
            className={week === "next" ? "active" : ""}
            onClick={() => setWeek("next")}
          >
            Próxima semana
          </button>
        </div>

        <div className="admin-section">
          <div className="admin-section__header">
            <div>
              <h3 className="admin-section__title">Horario semanal</h3>
              <p className="admin-section__hint">
                {week === "current"
                  ? "Vista solo lectura"
                  : "Editable y publicable"}
              </p>
            </div>

            {week === "next" && (
              <div className="admin-actions">
                <button
                  onClick={guardarCambios}
                  disabled={pendingMoves.length === 0}
                >
                  Guardar cambios ({pendingMoves.length})
                </button>

                <button className="btn-publish" onClick={publicar}>
                  Publicar semana
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p>Cargando…</p>
          ) : (
            <AdminCalendar
              bloques={bloques}
              aeronaves={aeronaves}
              items={items}
              pendingMoves={pendingMoves}
              setDragging={setDragging}
              handleDrop={handleDrop}
              week={week}
            />
          )}
        </div>
      </div>
    </>
  );
}
