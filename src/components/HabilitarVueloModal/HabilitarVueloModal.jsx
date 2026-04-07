import { useEffect, useState } from "react";
import { getAlumnosConLimite, habilitarVueloExtra } from "../../services/adminApi";
import "./HabilitarVueloModal.css";

function formatFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function HabilitarVueloModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [semana, setSemana] = useState(null);
  const [alumnos, setAlumnos] = useState([]);

  // Por alumno: { nuevoLimite: string, saving: bool, error: string }
  const [filas, setFilas] = useState({});

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getAlumnosConLimite();
      setSemana(data.semana);
      setAlumnos(data.alumnos);
      const estadoInicial = {};
      for (const a of data.alumnos) {
        estadoInicial[a.id_alumno] = { nuevoLimite: "", saving: false, error: "" };
      }
      setFilas(estadoInicial);
    } catch {
      setSemana(null);
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const setFila = (id_alumno, patch) =>
    setFilas((prev) => ({
      ...prev,
      [id_alumno]: { ...prev[id_alumno], ...patch },
    }));

  const handleGuardar = async (alumno) => {
    const { nuevoLimite } = filas[alumno.id_alumno];
    const num = Number(nuevoLimite);

    if (!nuevoLimite.trim()) {
      setFila(alumno.id_alumno, { error: "Ingresá un valor" });
      return;
    }
    if (!Number.isInteger(num) || num < 1) {
      setFila(alumno.id_alumno, { error: "Debe ser un número entero positivo" });
      return;
    }
    if (num > 6) {
      setFila(alumno.id_alumno, { error: "Máximo 6 vuelos por semana" });
      return;
    }
    if (num <= alumno.limite_vuelos) {
      setFila(alumno.id_alumno, { error: `Debe ser mayor al límite actual (${alumno.limite_vuelos})` });
      return;
    }

    setFila(alumno.id_alumno, { saving: true, error: "" });
    try {
      await habilitarVueloExtra(alumno.id_alumno, semana.id_semana, num);
      // Actualizar el límite en la lista local sin recargar todo
      setAlumnos((prev) =>
        prev.map((a) =>
          a.id_alumno === alumno.id_alumno ? { ...a, limite_vuelos: num } : a
        )
      );
      setFila(alumno.id_alumno, { nuevoLimite: "", saving: false, error: "" });
    } catch (e) {
      setFila(alumno.id_alumno, {
        saving: false,
        error: e.response?.data?.message || "Error al guardar",
      });
    }
  };

  const semanaLabel = semana
    ? `${formatFecha(semana.fecha_inicio)} — ${formatFecha(semana.fecha_fin)}`
    : null;

  return (
    <div className="hv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hv-modal">

        <div className="hv-header">
          <div className="hv-header-left">
            <h2>Gestión de alumnos — vuelos extra</h2>
            {semanaLabel && (
              <span className="hv-semana-label">Semana próxima: {semanaLabel}</span>
            )}
          </div>
          <button className="hv-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="hv-body">
          {loading ? (
            <p className="hv-loading">Cargando alumnos…</p>
          ) : !semana ? (
            <p className="hv-empty">No hay semana próxima configurada.</p>
          ) : alumnos.length === 0 ? (
            <p className="hv-empty">No hay alumnos activos.</p>
          ) : (
            <table className="hv-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th style={{ textAlign: "center" }}>Límite actual</th>
                  <th>Nuevo límite</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((a) => {
                  const fila = filas[a.id_alumno] ?? { nuevoLimite: "", saving: false, error: "" };
                  return (
                    <tr key={a.id_alumno}>
                      <td>{a.nombre_completo}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className="hv-limite-actual">{a.limite_vuelos}</span>
                      </td>
                      <td>
                        <div className="hv-input-wrap">
                          <input
                            className="hv-input"
                            type="number"
                            min={a.limite_vuelos + 1}
                            max={6}
                            value={fila.nuevoLimite}
                            onChange={(e) =>
                              setFila(a.id_alumno, { nuevoLimite: e.target.value, error: "" })
                            }
                            placeholder={String(a.limite_vuelos + 1)}
                          />
                          <button
                            className="hv-save-btn"
                            disabled={fila.saving || !fila.nuevoLimite.trim()}
                            onClick={() => handleGuardar(a)}
                          >
                            {fila.saving ? "…" : "Guardar"}
                          </button>
                        </div>
                        {fila.error && (
                          <div className="hv-row-error">{fila.error}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
