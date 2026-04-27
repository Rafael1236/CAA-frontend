import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getReporteVuelo,
  guardarReporteVuelo,
  enviarReporteVuelo,
  firmarReporteVueloAlumno,
} from "../../services/alumnoApi";
import {
  getReporteVueloInstructor,
  guardarReporteVueloInstructor,
  firmarReporteVuelo,
} from "../../services/instructorApi";
import SignaturePad from "../SignaturePad/SignaturePad";
import { generarPdfReporteVuelo } from "./reporteVueloPdf";
import "./ReporteVueloModal.css";

const TIPO_VUELO_OPTS = ["PASAJERO", "CARGA", "SOLO", "DOBLE", "FERRY", "LOCAL"];

const DATOS_INICIALES = {
  tipo_vuelo: "",
  tacometro_salida: "",
  tacometro_llegada: "",
  hobbs_salida: "",
  hobbs_llegada: "",
  combustible_salida: "",
  combustible_llegada: "",
  cantidad_combustible: "",
};

function badge(estado) {
  if (!estado) return null;
  const cfg = {
    BORRADOR: { cls: "rv-badge--borrador", label: "Borrador" },
    PENDIENTE_INSTRUCTOR: { cls: "rv-badge--pendiente", label: "Pendiente instructor" },
    PENDIENTE_ALUMNO: { cls: "rv-badge--pendiente", label: "Pendiente firma alumno" },
    COMPLETADO: { cls: "rv-badge--completado", label: "Completado" },
  };
  const c = cfg[estado];
  if (!c) return null;
  return <span className={`rv-badge ${c.cls}`}>{c.label}</span>;
}

function formatCorrelativo(aeronaveModelo, idVuelo) {
  if (!aeronaveModelo || !idVuelo) return "—";
  return `${aeronaveModelo}-${String(idVuelo).padStart(7, "0")}`;
}

export default function ReporteVueloModal({ id_vuelo, mode = "alumno", onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vueloInfo, setVueloInfo] = useState(null);
  const [estado, setEstado] = useState(null);
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [firmaAlumno, setFirmaAlumno] = useState(null); // base64 o null
  const [firmaInstructor, setFirmaInstructor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const firmaAlumnoRef = useRef(null);
  const firmaInstructorRef = useRef(null);

  // Instructor fills form (editable when null or BORRADOR); alumno never edits data
  const isReadonly = mode === "instructor"
    ? (estado === "PENDIENTE_ALUMNO" || estado === "COMPLETADO")
    : true;

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = mode === "alumno"
          ? await getReporteVuelo(id_vuelo)
          : await getReporteVueloInstructor(id_vuelo);

        setVueloInfo(data.vuelo);

        if (data.reporte) {
          const r = data.reporte;
          setEstado(r.estado);
          setDatos({
            tipo_vuelo: r.tipo_vuelo ?? "",
            tacometro_salida: r.tacometro_salida ?? "",
            tacometro_llegada: r.tacometro_llegada ?? "",
            hobbs_salida: r.hobbs_salida ?? "",
            hobbs_llegada: r.hobbs_llegada ?? "",
            combustible_salida: r.combustible_salida ?? "",
            combustible_llegada: r.combustible_llegada ?? "",
            cantidad_combustible: r.cantidad_combustible ?? "",
          });
          if (r.firma_alumno) setFirmaAlumno(r.firma_alumno);
          if (r.firma_instructor) setFirmaInstructor(r.firma_instructor);
        }
      } catch (e) {
        setError("No se pudo cargar el reporte. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id_vuelo, mode]);

  function setField(key, val) {
    setDatos((prev) => ({ ...prev, [key]: val }));
  }

  // ── Guardar borrador (instructor) ─────────────────────────────────────────
  async function handleGuardar() {
    setSaving(true);
    try {
      if (mode === "instructor") {
        await guardarReporteVueloInstructor(id_vuelo, datos);
      } else {
        await guardarReporteVuelo(id_vuelo, datos);
      }
      setEstado("BORRADOR");
    } catch {
      toast.error("Error al guardar el borrador.");
    } finally {
      setSaving(false);
    }
  }

  // ── Instructor firma y envía a alumno ─────────────────────────────────────
  async function handleFirmarInstructor() {
    if (firmaInstructorRef.current?.isEmpty()) {
      toast.warning("Debe dibujar su firma antes de enviar.");
      return;
    }
    const firma = firmaInstructorRef.current.toDataURL();
    setGenerating(true);
    try {
      await firmarReporteVuelo(id_vuelo, {
        ...datos,
        firma_instructor: firma,
      });
      setFirmaInstructor(firma);
      setEstado("PENDIENTE_ALUMNO");
    } catch {
      toast.error("Error al enviar el reporte al alumno.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Alumno firma y completa ────────────────────────────────────────────────
  async function handleFirmarAlumno() {
    if (firmaAlumnoRef.current?.isEmpty()) {
      toast.warning("Debe dibujar su firma antes de completar.");
      return;
    }
    const firma = firmaAlumnoRef.current.toDataURL();
    setSaving(true);
    try {
      await firmarReporteVueloAlumno(id_vuelo, firma);
      setFirmaAlumno(firma);
      setEstado("COMPLETADO");
    } catch {
      toast.error("Error al firmar el reporte.");
    } finally {
      setSaving(false);
    }
  }

  // ── Descargar PDF ──────────────────────────────────────────────────────────
  async function handleDescargar() {
    setGenerating(true);
    try {
      await generarPdfReporteVuelo({
        vueloInfo,
        datos,
        firmaAlumno,
        firmaInstructor,
        download: true,
      });
    } finally {
      setGenerating(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rv-overlay">
        <div className="rv-modal">
          <div className="rv-loading">Cargando reporte…</div>
        </div>
      </div>
    );
  }

  const v = vueloInfo ?? {};
  const fechaStr = v.fecha_vuelo
    ? new Date(v.fecha_vuelo).toLocaleDateString("es-SV")
    : "—";
  const horaStr = v.hora_inicio
    ? v.hora_inicio.slice(0, 5)
    : "—";

  return (
    <div className="rv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rv-modal">
        {/* ── Header ── */}
        <div className="rv-header">
          <div className="rv-header-left">
            <h2>
              Reporte de Vuelo
              {badge(estado)}
            </h2>
            <div className="rv-header-meta">
              {v.aeronave_codigo && <span>{v.aeronave_codigo}</span>}
              {v.aeronave_modelo && <span> · {v.aeronave_modelo}</span>}
              {v.alumno_nombre && <span> · {v.alumno_nombre}</span>}
            </div>
          </div>
          <button className="rv-close" onClick={onClose}>×</button>
        </div>

        {/* ── Body ── */}
        <div className="rv-body">
          {error && <div className="rv-error">{error}</div>}

          {/* Info fija del vuelo */}
          <div className="rv-section">
            <div className="rv-section-title">Datos del vuelo</div>
            <div className="rv-info-grid">
              {[
                { label: "Reporte #", val: formatCorrelativo(v.aeronave_modelo, v.id_vuelo) },
                { label: "Hora", val: horaStr },
                { label: "Fecha", val: fechaStr },
                { label: "Tipo avión", val: v.aeronave_modelo ?? "—" },
                { label: "Avión No.", val: v.aeronave_codigo ?? "—" },
                { label: "Vuelo No.", val: formatCorrelativo(v.aeronave_modelo, v.id_vuelo) },
              ].map(({ label, val }) => (
                <div key={label} className="rv-info-field">
                  <span className="rv-label">{label}</span>
                  <span className="rv-info-val">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de vuelo */}
          <div className="rv-section">
            <div className="rv-section-title">Tipo de vuelo</div>
            <select
              className="rv-input rv-select"
              value={datos.tipo_vuelo}
              onChange={(e) => setField("tipo_vuelo", e.target.value)}
              disabled={isReadonly}
            >
              <option value="">Seleccione…</option>
              {TIPO_VUELO_OPTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Datos tacómetro / hobbs / combustible */}
          <div className="rv-section">
            <div className="rv-section-title">Tacómetro, Hobbs y Combustible</div>
            <div className="rv-data-grid">
              {[
                { key: "tacometro_salida", label: "Tacómetro Salida" },
                { key: "tacometro_llegada", label: "Tacómetro Llegada" },
                { key: "hobbs_salida", label: "Hobbs Salida" },
                { key: "hobbs_llegada", label: "Hobbs Llegada" },
                { key: "combustible_salida", label: "Combustible Salida" },
                { key: "combustible_llegada", label: "Combustible Llegada" },
                { key: "cantidad_combustible", label: "Cantidad agregada" },
              ].map(({ key, label }) => (
                <div key={key} className="rv-data-field">
                  <span className="rv-label">{label}</span>
                  {isReadonly ? (
                    <span className="rv-info-val">
                      {datos[key] !== "" && !isNaN(parseFloat(datos[key]))
                        ? parseFloat(datos[key]).toFixed(1)
                        : "—"}
                    </span>
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      max="9999.9"
                      placeholder="0000.0"
                      className="rv-input"
                      value={datos[key]}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Firmas */}
          <div className="rv-section">
            <div className="rv-section-title">Firmas</div>
            <div className="rv-firmas-grid">
              {/* Firma instructor */}
              <div className="rv-firma-box">
                <div className="rv-firma-label">Firma del Instructor</div>
                <SignaturePad
                  ref={firmaInstructorRef}
                  width={320}
                  height={120}
                  disabled={isReadonly || mode !== "instructor"}
                  value={firmaInstructor}
                />
                {mode === "instructor" && !isReadonly && (
                  <button
                    className="rv-btn-clear"
                    onClick={() => firmaInstructorRef.current?.clear()}
                  >
                    Limpiar
                  </button>
                )}
                <div className="rv-firma-name">
                  {v.instructor_nombre ?? "—"}
                  {v.instructor_licencia && <span className="rv-firma-lic"> · Lic. {v.instructor_licencia}</span>}
                </div>
              </div>

              {/* Firma alumno */}
              <div className="rv-firma-box">
                <div className="rv-firma-label">Firma del Alumno</div>
                <SignaturePad
                  ref={firmaAlumnoRef}
                  width={320}
                  height={120}
                  disabled={mode !== "alumno" || estado !== "PENDIENTE_ALUMNO"}
                  value={firmaAlumno}
                />
                {mode === "alumno" && estado === "PENDIENTE_ALUMNO" && firmaAlumno == null && (
                  <button
                    className="rv-btn-clear"
                    onClick={() => firmaAlumnoRef.current?.clear()}
                  >
                    Limpiar
                  </button>
                )}
                <div className="rv-firma-name">
                  {v.alumno_nombre ?? "—"}
                  {v.alumno_licencia && <span className="rv-firma-lic"> · Lic. {v.alumno_licencia}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="rv-footer">
          <button className="rv-btn" onClick={onClose} disabled={saving || generating}>
            Cerrar
          </button>

          {/* Instructor — borrador o sin estado: puede guardar y firmar */}
          {mode === "instructor" && !isReadonly && (
            <>
              <button
                className="rv-btn rv-btn--primary"
                onClick={handleGuardar}
                disabled={saving || generating}
              >
                {saving ? "Guardando…" : "Guardar borrador"}
              </button>
              <button
                className="rv-btn rv-btn--success"
                onClick={handleFirmarInstructor}
                disabled={saving || generating}
              >
                {generating ? "Enviando…" : "Firmar y enviar a alumno"}
              </button>
            </>
          )}

          {/* Alumno — pendiente de su firma */}
          {mode === "alumno" && estado === "PENDIENTE_ALUMNO" && (
            <button
              className="rv-btn rv-btn--success"
              onClick={handleFirmarAlumno}
              disabled={saving}
            >
              {saving ? "Firmando…" : "Firmar reporte"}
            </button>
          )}

          {/* Cualquiera — completado */}
          {estado === "COMPLETADO" && (
            <button
              className="rv-btn rv-btn--primary"
              onClick={handleDescargar}
              disabled={generating}
            >
              {generating ? "Generando PDF…" : "Descargar PDF"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
