import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAlumnosConLimite, habilitarVueloExtra } from "../../services/adminApi";
import "./Alumnos.css";

function formatFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function AlumnosAdmin() {
  const [loading, setLoading] = useState(true);
  const [semana, setSemana] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
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
      setFila(alumno.id_alumno, { error: "Número entero positivo" });
      return;
    }
    if (num > 6) {
      setFila(alumno.id_alumno, { error: "Máximo 6" });
      return;
    }
    if (num <= alumno.limite_vuelos) {
      setFila(alumno.id_alumno, { error: `Mínimo ${alumno.limite_vuelos + 1}` });
      return;
    }

    setFila(alumno.id_alumno, { saving: true, error: "" });
    try {
      await habilitarVueloExtra(alumno.id_alumno, semana.id_semana, num);
      setAlumnos((prev) =>
        prev.map((a) =>
          a.id_alumno === alumno.id_alumno ? { ...a, limite_vuelos: num } : a
        )
      );
      setFila(alumno.id_alumno, { nuevoLimite: "", saving: false, error: "" });
      toast.success(`Límite actualizado para ${alumno.nombre_completo}`);
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
    <div className="alms">
      <div className="alms__card">
        <div className="alms__card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#1B365D' }}>Gestión de Alumnos</h3>
            <p className="alms__hint" style={{ marginTop: '4px' }}>
              Aumentá el límite de vuelos permitidos para agendar en la próxima semana.
            </p>
          </div>
          <div className="alms__week-info" style={{ margin: 0 }}>
            <i className="bi bi-calendar-check"></i>
            <div>
              <span className="alms__week-label">Semana de planificación</span>
              <span className="alms__week-dates">{semanaLabel || "No disponible"}</span>
            </div>
          </div>
        </div>

        <div className="alms__body">
          {loading ? (
            <div className="alms__loading">Cargando lista de alumnos…</div>
          ) : !semana ? (
            <div className="alms__empty">No hay una semana futura configurada para planificación.</div>
          ) : alumnos.length === 0 ? (
            <div className="alms__empty">No hay alumnos activos registrados.</div>
          ) : (
            <div className="alms__table-wrap">
              <table className="alms__table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th className="text-center">Límite Base</th>
                    <th>Ajustar Límite</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((a) => {
                    const fila = filas[a.id_alumno] ?? { nuevoLimite: "", saving: false, error: "" };
                    return (
                      <tr key={a.id_alumno}>
                        <td>
                          <div className="alms__alumno-name">{a.nombre_completo}</div>
                          <div className="alms__alumno-sub">ID: {String(a.id_alumno).padStart(3, '0')}</div>
                        </td>
                        <td className="text-center">
                          <span className="alms__limite-badge">{a.limite_vuelos}</span>
                        </td>
                        <td>
                          <div className="alms__action-row">
                            <div className="alms__input-group">
                              <input
                                className="alms__input"
                                type="number"
                                min={a.limite_vuelos + 1}
                                max={6}
                                value={fila.nuevoLimite}
                                onChange={(e) =>
                                  setFila(a.id_alumno, { nuevoLimite: e.target.value, error: "" })
                                }
                                placeholder={`Ej: ${a.limite_vuelos + 1}`}
                              />
                              <button
                                className="alms__save-btn"
                                disabled={fila.saving || !fila.nuevoLimite.trim()}
                                onClick={() => handleGuardar(a)}
                              >
                                {fila.saving ? <span className="alms__spinner"></span> : "Actualizar"}
                              </button>
                            </div>
                            {fila.error && (
                              <div className="alms__error-msg">
                                <i className="bi bi-exclamation-circle"></i> {fila.error}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
