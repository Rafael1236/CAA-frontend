import { useEffect, useRef, useState } from "react";
import {
  getReporteVuelo,
  guardarReporteVuelo,
  enviarReporteVuelo,
} from "../../services/alumnoApi";
import {
  getReporteVueloInstructor,
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
    BORRADOR:             { cls: "rv-badge--borrador",    label: "Borrador" },
    PENDIENTE_INSTRUCTOR: { cls: "rv-badge--pendiente",   label: "Pendiente instructor" },
    COMPLETADO:           { cls: "rv-badge--completado",  label: "Completado" },
  };
  const c = cfg[estado];
  if (!c) return null;
  return <span className={`rv-badge ${c.cls}`}>{c.label}</span>;
}

export default function ReporteVueloModal({ id_vuelo, mode = "alumno", onClose }) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [vueloInfo, setVueloInfo] = useState(null);
  const [estado, setEstado]     = useState(null);
  const [datos, setDatos]       = useState(DATOS_INICIALES);
  const [firmaAlumno, setFirmaAlumno]     = useState(null); // base64 o null
  const [firmaInstructor, setFirmaInstructor] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);

  const firmaAlumnoRef     = useRef(null);
  const firmaInstructorRef = useRef(null);

  const isReadonly = mode === "alumno"
    ? (estado === "PENDIENTE_INSTRUCTOR" || estado === "COMPLETADO")
    : true; // instructor nunca edita datos

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
            tipo_vuelo:           r.tipo_vuelo           ?? "",
            tacometro_salida:     r.tacometro_salida     ?? "",
            tacometro_llegada:    r.tacometro_llegada    ?? "",
            hobbs_salida:         r.hobbs_salida         ?? "",
            hobbs_llegada:        r.hobbs_llegada        ?? "",
            combustible_salida:   r.combustible_salida   ?? "",
            combustible_llegada:  r.combustible_llegada  ?? "",
            cantidad_combustible: r.cantidad_combustible ?? "",
          });
          if (r.firma_alumno)     setFirmaAlumno(r.firma_alumno);
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

  // ── Guardar borrador ───────────────────────────────────────────────────────
  async function handleGuardar() {
    setSaving(true);
    try {
      await guardarReporteVuelo(id_vuelo, datos);
      setEstado("BORRADOR");
    } catch {
      alert("Error al guardar el borrador.");
    } finally {
      setSaving(false);
    }
  }

  // ── Enviar reporte (alumno firma) ──────────────────────────────────────────
  async function handleEnviar() {
    if (firmaAlumnoRef.current?.isEmpty()) {
      alert("Debe dibujar su firma antes de enviar.");
      return;
    }
    const firma = firmaAlumnoRef.current.toDataURL();
    setSaving(true);
    try {
      await enviarReporteVuelo(id_vuelo, { ...datos, firma_alumno: firma });
      setFirmaAlumno(firma);
      setEstado("PENDIENTE_INSTRUCTOR");
    } catch {
      alert("Error al enviar el reporte.");
    } finally {
      setSaving(false);
    }
  }

  // ── Instructor firma y completa ────────────────────────────────────────────
  async function handleFirmarInstructor() {
    if (firmaInstructorRef.current?.isEmpty()) {
      alert("Debe dibujar su firma antes de completar.");
      return;
    }
    const firma = firmaInstructorRef.current.toDataURL();
    setGenerating(true);
    try {
      const pdfBase64 = await generarPdfReporteVuelo({
        vueloInfo,
        datos,
        firmaAlumno,
        firmaInstructor: firma,
      });
      await firmarReporteVuelo(id_vuelo, {
        firma_instructor: firma,
        archivo_pdf: pdfBase64,
      });
      setFirmaInstructor(firma);
      setEstado("COMPLETADO");
    } catch {
      alert("Error al completar el reporte.");
    } finally {
      setGenerating(false);
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
              {v.alumno_nombre   && <span> · {v.alumno_nombre}</span>}
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
                { label: "Reporte #",    val: v.id_vuelo ?? "—" },
                { label: "Hora",         val: horaStr },
                { label: "Fecha",        val: fechaStr },
                { label: "Tipo avión",   val: v.aeronave_modelo ?? "—" },
                { label: "Avión No.",    val: v.aeronave_codigo ?? "—" },
                { label: "Vuelo No.",    val: v.id_vuelo ?? "—" },
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
                { key: "tacometro_salida",     label: "Tacómetro Salida" },
                { key: "tacometro_llegada",    label: "Tacómetro Llegada" },
                { key: "hobbs_salida",         label: "Hobbs Salida" },
                { key: "hobbs_llegada",        label: "Hobbs Llegada" },
                { key: "combustible_salida",   label: "Combustible Salida" },
                { key: "combustible_llegada",  label: "Combustible Llegada" },
                { key: "cantidad_combustible", label: "Cantidad agregada" },
              ].map(({ key, label }) => (
                <div key={key} className="rv-data-field">
                  <span className="rv-label">{label}</span>
                  <input
                    type="number"
                    step="0.01"
                    className="rv-input"
                    value={datos[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    disabled={isReadonly}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Firmas */}
          <div className="rv-section">
            <div className="rv-section-title">Firmas</div>
            <div className="rv-firmas-grid">
              {/* Firma alumno */}
              <div className="rv-firma-box">
                <div className="rv-firma-label">Firma del Alumno</div>
                <SignaturePad
                  ref={firmaAlumnoRef}
                  width={320}
                  height={120}
                  disabled={mode !== "alumno" || isReadonly}
                  value={firmaAlumno}
                />
                {!isReadonly && mode === "alumno" && firmaAlumno == null && (
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

              {/* Firma instructor */}
              <div className="rv-firma-box">
                <div className="rv-firma-label">Firma del Instructor</div>
                <SignaturePad
                  ref={firmaInstructorRef}
                  width={320}
                  height={120}
                  disabled={mode !== "instructor" || estado !== "PENDIENTE_INSTRUCTOR"}
                  value={firmaInstructor}
                />
                {mode === "instructor" && estado === "PENDIENTE_INSTRUCTOR" && (
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
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="rv-footer">
          <button className="rv-btn" onClick={onClose} disabled={saving || generating}>
            Cerrar
          </button>

          {/* Alumno — sin estado todavía o borrador */}
          {mode === "alumno" && (estado === null || estado === "BORRADOR") && (
            <>
              <button
                className="rv-btn rv-btn--primary"
                onClick={handleGuardar}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar borrador"}
              </button>
              <button
                className="rv-btn rv-btn--success"
                onClick={handleEnviar}
                disabled={saving}
              >
                {saving ? "Enviando…" : "Enviar reporte"}
              </button>
            </>
          )}

          {/* Instructor — pendiente de firma */}
          {mode === "instructor" && estado === "PENDIENTE_INSTRUCTOR" && (
            <button
              className="rv-btn rv-btn--success"
              onClick={handleFirmarInstructor}
              disabled={generating}
            >
              {generating ? "Completando…" : "Firmar y completar"}
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
