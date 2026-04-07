import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import {
  getMantenimientoAeronaves,
  completarMantenimiento,
  registrarHorasManuales,
} from "../../services/adminApi";
import "./Mantenimiento.css";

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
}

function BarraHoras({ acumuladas, proxima }) {
  const pct = proxima > 0
    ? Math.min(100, Math.round((acumuladas / proxima) * 100))
    : 0;
  const cls =
    pct >= 90 ? "mnt__barra--rojo" :
    pct >= 75 ? "mnt__barra--naranja" : "mnt__barra--verde";

  return (
    <div className="mnt__barra-wrap">
      <div className={`mnt__barra ${cls}`} style={{ width: `${pct}%` }} />
      <span className="mnt__barra-pct">{pct}%</span>
    </div>
  );
}

// ── Modal horas manuales ───────────────────────────────────────────────────
function HorasManualModal({ aeronaves, onClose, onGuardado }) {
  const [idAeronave, setIdAeronave] = useState(aeronaves[0]?.id_aeronave ?? "");
  const [horas, setHoras] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleGuardar = async () => {
    const h = parseFloat(horas);
    if (!horas.trim() || isNaN(h) || h <= 0) {
      setError("Ingresá un valor positivo");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await registrarHorasManuales(Number(idAeronave), h, desc);
      onGuardado();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Error al registrar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mnt__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mnt__modal">
        <div className="mnt__modal-header">
          <h3>Registrar horas manualmente</h3>
          <button className="mnt__modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mnt__modal-body">
          <div className="mnt__field">
            <label className="mnt__label">Aeronave</label>
            <select
              className="mnt__input"
              value={idAeronave}
              onChange={(e) => setIdAeronave(e.target.value)}
            >
              {aeronaves.map((a) => (
                <option key={a.id_aeronave} value={a.id_aeronave}>
                  {a.codigo} — {parseFloat(a.horas_acumuladas).toFixed(1)}h acumuladas
                </option>
              ))}
            </select>
          </div>
          <div className="mnt__field">
            <label className="mnt__label">Horas a agregar</label>
            <input
              className="mnt__input"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Ej: 1.5"
              value={horas}
              onChange={(e) => { setHoras(e.target.value); setError(""); }}
            />
          </div>
          <div className="mnt__field">
            <label className="mnt__label">Descripción (opcional)</label>
            <input
              className="mnt__input"
              type="text"
              placeholder="Motivo del ajuste…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          {error && <p className="mnt__error">{error}</p>}
        </div>
        <div className="mnt__modal-footer">
          <button className="mnt__btn" onClick={onClose}>Cancelar</button>
          <button
            className="mnt__btn mnt__btn--primary"
            disabled={saving}
            onClick={handleGuardar}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function MantenimientoAdmin() {
  const navigate = useNavigate();
  const [aeronaves, setAeronaves]           = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [completing, setCompleting]         = useState(null);
  const [tabMant, setTabMant]               = useState("pendientes");

  const cargar = useCallback(async () => {
    try {
      const data = await getMantenimientoAeronaves();
      setAeronaves(data.aeronaves);
      setMantenimientos(data.mantenimientos);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCompletar = async (id_mantenimiento) => {
    if (!window.confirm("¿Marcar este mantenimiento como completado?")) return;
    setCompleting(id_mantenimiento);
    try {
      await completarMantenimiento(id_mantenimiento);
      await cargar();
    } catch (e) {
      alert(e.response?.data?.message || "Error al completar");
    } finally {
      setCompleting(null);
    }
  };

  const pendientes  = mantenimientos.filter((m) => !m.completado);
  const completados = mantenimientos.filter((m) =>  m.completado);
  const listaMant   = tabMant === "pendientes" ? pendientes : completados;

  return (
    <>
      <Header />

      <div className="mnt">
        {/* ── Cabecera ──────────────────────────────────────────────── */}
        <div className="mnt__top">
          <div className="mnt__top-left">
            <button className="mnt__back" onClick={() => navigate("/admin/dashboard")}>
              ← Volver
            </button>
            <div>
              <p className="mnt__eyebrow">Panel de administración</p>
              <h2 className="mnt__title">Mantenimiento de aeronaves</h2>
              <p className="mnt__subtitle">Ciclos de revisión y registro de horas</p>
            </div>
          </div>
          <button
            className="mnt__btn mnt__btn--primary"
            onClick={() => setShowModal(true)}
          >
            + Horas manuales
          </button>
        </div>

        {loading ? (
          <p className="mnt__loading">Cargando…</p>
        ) : (
          <>
            {/* ── Aeronaves ──────────────────────────────────────────── */}
            <section className="mnt__section">
              <h3 className="mnt__section-title">Estado de flota</h3>
              <div className="mnt__table-wrap">
                <table className="mnt__table">
                  <thead>
                    <tr>
                      <th className="mnt__th">Aeronave</th>
                      <th className="mnt__th">Tipo</th>
                      <th className="mnt__th mnt__th--num">Horas acum.</th>
                      <th className="mnt__th mnt__th--num">Próx. revisión</th>
                      <th className="mnt__th">Tipo rev.</th>
                      <th className="mnt__th mnt__th--num">Horas restantes</th>
                      <th className="mnt__th">Progreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aeronaves.map((a) => {
                      const restantes = parseFloat(a.horas_restantes);
                      const alerta = restantes <= 5 ? "mnt__td--rojo" : restantes <= 10 ? "mnt__td--naranja" : "";
                      return (
                        <tr key={a.id_aeronave} className="mnt__tr">
                          <td className="mnt__td mnt__td--codigo">{a.codigo}</td>
                          <td className="mnt__td">{a.tipo}</td>
                          <td className="mnt__td mnt__td--num">
                            {parseFloat(a.horas_acumuladas).toFixed(1)}h
                          </td>
                          <td className="mnt__td mnt__td--num">
                            {parseFloat(a.horas_proxima_revision).toFixed(1)}h
                          </td>
                          <td className="mnt__td">
                            <span className="mnt__tipo-badge">{a.tipo_proxima_revision}</span>
                          </td>
                          <td className={`mnt__td mnt__td--num ${alerta}`}>
                            {restantes.toFixed(1)}h
                          </td>
                          <td className="mnt__td mnt__td--barra">
                            <BarraHoras
                              acumuladas={parseFloat(a.horas_acumuladas)}
                              proxima={parseFloat(a.horas_proxima_revision)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Mantenimientos ─────────────────────────────────────── */}
            <section className="mnt__section">
              <h3 className="mnt__section-title">Registros de mantenimiento</h3>

              <div className="mnt__tabs">
                <button
                  className={`mnt__tab ${tabMant === "pendientes" ? "mnt__tab--active" : ""}`}
                  onClick={() => setTabMant("pendientes")}
                >
                  Pendientes ({pendientes.length})
                </button>
                <button
                  className={`mnt__tab ${tabMant === "completados" ? "mnt__tab--active" : ""}`}
                  onClick={() => setTabMant("completados")}
                >
                  Completados ({completados.length})
                </button>
              </div>

              {listaMant.length === 0 ? (
                <p className="mnt__empty">
                  No hay mantenimientos {tabMant === "pendientes" ? "pendientes" : "completados"}.
                </p>
              ) : (
                <div className="mnt__table-wrap">
                  <table className="mnt__table">
                    <thead>
                      <tr>
                        <th className="mnt__th">Aeronave</th>
                        <th className="mnt__th">Tipo</th>
                        <th className="mnt__th">Fecha programada</th>
                        <th className="mnt__th mnt__th--num">Horas al mant.</th>
                        {tabMant === "completados" && (
                          <th className="mnt__th">Completado</th>
                        )}
                        {tabMant === "pendientes" && (
                          <th className="mnt__th"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {listaMant.map((m) => (
                        <tr key={m.id_mantenimiento} className="mnt__tr">
                          <td className="mnt__td mnt__td--codigo">{m.aeronave_codigo}</td>
                          <td className="mnt__td">
                            <span className="mnt__tipo-badge">{m.tipo}</span>
                          </td>
                          <td className="mnt__td">{formatFecha(m.fecha_programada)}</td>
                          <td className="mnt__td mnt__td--num">
                            {m.horas_al_mantenimiento != null
                              ? `${parseFloat(m.horas_al_mantenimiento).toFixed(1)}h`
                              : "—"}
                          </td>
                          {tabMant === "completados" && (
                            <td className="mnt__td">{formatFecha(m.fecha_completado)}</td>
                          )}
                          {tabMant === "pendientes" && (
                            <td className="mnt__td">
                              <button
                                className="mnt__btn mnt__btn--sm mnt__btn--primary"
                                disabled={completing === m.id_mantenimiento}
                                onClick={() => handleCompletar(m.id_mantenimiento)}
                              >
                                {completing === m.id_mantenimiento ? "…" : "Completar"}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {showModal && (
        <HorasManualModal
          aeronaves={aeronaves}
          onClose={() => setShowModal(false)}
          onGuardado={cargar}
        />
      )}
    </>
  );
}
