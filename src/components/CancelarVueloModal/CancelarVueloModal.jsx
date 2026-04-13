import { useEffect, useState } from "react";
import { getCondicionesCancelacion, cancelarVuelo } from "../../services/alumnoApi";
import "./CancelarVueloModal.css";

/**
 * Props:
 *   vuelo          – { id_vuelo, fecha_hora_vuelo, ... }
 *   tipoCancel     – "NORMAL" | "EMERGENCIA"
 *   onClose()      – cierra sin refrescar
 *   onCancelado()  – llamado tras cancelación exitosa
 */
export default function CancelarVueloModal({ vuelo, tipoCancel, onClose, onCancelado }) {
  const [condiciones, setCondiciones] = useState([]);
  const [loadingCond, setLoadingCond] = useState(true);
  const [aceptado, setAceptado] = useState(false);
  const [justificacion, setJustificacion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCondicionesCancelacion()
      .then(setCondiciones)
      .catch(() => setCondiciones([]))
      .finally(() => setLoadingCond(false));
  }, []);

  const puedeConfirmar =
    aceptado &&
    justificacion.trim().length > 0 &&
    (tipoCancel === "NORMAL" || archivo !== null) &&
    !submitting;

  const handleConfirmar = async () => {
    setError("");
    setSubmitting(true);
    try {
      await cancelarVuelo(vuelo.id_vuelo, {
        tipo_cancelacion: tipoCancel,
        justificacion_cancelacion: justificacion.trim(),
        archivo,
      });
      onCancelado();
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo cancelar el vuelo. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cv-modal">

        {/* Header */}
        <div className="cv-header">
          <h2>Cancelar vuelo</h2>
          <span className={tipoCancel === "EMERGENCIA" ? "cv-badge-emergencia" : "cv-badge-normal"}>
            {tipoCancel === "EMERGENCIA" ? "Emergencia" : "Normal"}
          </span>
          <button className="cv-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Body */}
        <div className="cv-body">

          {/* Condiciones */}
          {loadingCond ? (
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Cargando condiciones…</p>
          ) : condiciones.length > 0 && (
            <div>
              <p className="cv-condiciones-titulo">Condiciones de cancelación</p>
              <ul className="cv-condiciones-lista">
                {condiciones.map((c) => (
                  <li key={c.id_condicion} className="cv-condicion-item">
                    <div className="cv-condicion-titulo">{c.texto}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checkbox de aceptación */}
          <label className="cv-acepto">
            <input
              type="checkbox"
              checked={aceptado}
              onChange={(e) => setAceptado(e.target.checked)}
            />
            He leído y acepto las condiciones de cancelación
          </label>

          {/* Justificación */}
          <div className="cv-field">
            <label className="cv-label">
              Justificación <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              className="cv-textarea"
              placeholder="Explicá brevemente el motivo de la cancelación…"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={3}
            />
          </div>

          {/* Archivo (solo EMERGENCIA) */}
          {tipoCancel === "EMERGENCIA" && (
            <div className="cv-field">
              <label className="cv-label">
                Documento adjunto <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setArchivo(e.target.files[0] || null)}
              />
              <span className="cv-file-hint">PDF, JPG o PNG · máx. 10 MB</span>
            </div>
          )}

          {error && <div className="cv-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="cv-footer">
          <button className="cv-btn-cancelar" onClick={onClose} disabled={submitting}>
            Volver
          </button>
          <button
            className="cv-btn-confirmar"
            onClick={handleConfirmar}
            disabled={!puedeConfirmar}
          >
            {submitting ? "Cancelando…" : "Confirmar cancelación"}
          </button>
        </div>

      </div>
    </div>
  );
}
