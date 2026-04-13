import { useEffect, useState } from "react";
import {
  getLoadsheet,
  guardarLoadsheet,
  completarLoadsheet,
} from "../../services/alumnoApi";
import { generarPdfLoadsheet } from "./loadsheetPdf";
import "./LoadsheetModal.css";

// ── Waypoint vacío ─────────────────────────────────────────────────────────────
const WP_VACIO = {
  waypoint: "", alt_fl: "", wv: "",     tc: "",  var: "",  mc: "",
  wca: "",     mh: "",      dev: "",    ch: "",  tas: "",  gs: "",
  nm: "",      eta: "",     ata: "",    fuel_req: "", fuel_act: "",
};

const COMBUSTIBLE_INICIAL = {
  taxi: "", trip: "", rr_5: "", alt1_ifr: "", alt2_ifr: "",
  final_reserve: "", min_req: "", extra: "", tfob: "",
};

const COLS_WP = [
  { key: "waypoint",  label: "WAYPOINT",  w: 80 },
  { key: "alt_fl",    label: "ALT/FL",    w: 52 },
  { key: "wv",        label: "W/V",       w: 52 },
  { key: "tc",        label: "TC",        w: 40 },
  { key: "var",       label: "VAR",       w: 40 },
  { key: "mc",        label: "MC",        w: 40 },
  { key: "wca",       label: "WCA",       w: 40 },
  { key: "mh",        label: "MH",        w: 40 },
  { key: "dev",       label: "DEV",       w: 40 },
  { key: "ch",        label: "CH",        w: 40 },
  { key: "tas",       label: "TAS",       w: 40 },
  { key: "gs",        label: "GS",        w: 40 },
  { key: "nm",        label: "NM",        w: 40 },
  { key: "eta",       label: "ETA",       w: 52 },
  { key: "ata",       label: "ATA",       w: 52 },
  { key: "fuel_req",  label: "FUEL REQ",  w: 58 },
  { key: "fuel_act",  label: "FUEL ACT",  w: 58 },
];

export default function LoadsheetModal({ id_vuelo, onClose }) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [vueloInfo, setVueloInfo]   = useState(null);
  const [lsEstado, setLsEstado] = useState(null); // "BORRADOR" | "COMPLETADO" | null
  const [comb, setComb]         = useState(COMBUSTIBLE_INICIAL);
  const [waypoints, setWaypoints] = useState([{ ...WP_VACIO }]);
  const [saving, setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getLoadsheet(id_vuelo);
        setVueloInfo(data.vuelo);

        if (data.loadsheet) {
          setLsEstado(data.loadsheet.estado);
          const ls = data.loadsheet;
          setComb({
            taxi:          ls.taxi          ?? "",
            trip:          ls.trip          ?? "",
            rr_5:          ls.rr_5          ?? "",
            alt1_ifr:      ls.alt1_ifr      ?? "",
            alt2_ifr:      ls.alt2_ifr      ?? "",
            final_reserve: ls.final_reserve ?? "",
            min_req:       ls.min_req       ?? "",
            extra:         ls.extra         ?? "",
            tfob:          ls.tfob          ?? "",
          });
        }

        if (data.waypoints?.length > 0) {
          setWaypoints(
            data.waypoints.map((wp) =>
              Object.fromEntries(COLS_WP.map(({ key }) => [key, wp[key] ?? ""]))
            )
          );
        }
      } catch (e) {
        setError(e.response?.data?.message || "No se pudo cargar el loadsheet.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id_vuelo]);

  // ── Waypoints helpers ──────────────────────────────────────────────────────
  const setWpField = (idx, key, value) =>
    setWaypoints((prev) =>
      prev.map((wp, i) => (i === idx ? { ...wp, [key]: value } : wp))
    );

  const agregarFila = () => setWaypoints((prev) => [...prev, { ...WP_VACIO }]);

  const eliminarFila = (idx) =>
    setWaypoints((prev) => prev.filter((_, i) => i !== idx));

  // ── Guardar borrador ───────────────────────────────────────────────────────
  const handleGuardar = async () => {
    setSaving(true);
    try {
      await guardarLoadsheet(id_vuelo, { ...comb, waypoints });
      setLsEstado("BORRADOR");
      alert("Loadsheet guardado como borrador.");
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo guardar el loadsheet.");
    } finally {
      setSaving(false);
    }
  };

  // ── Descargar PDF sin completar ────────────────────────────────────────────
  const handleDescargar = async () => {
    setSaving(true);
    try {
      const pdfBlob = await generarPdfLoadsheet(comb, waypoints, vueloInfo);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loadsheet_vuelo_${id_vuelo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al generar el PDF.");
    } finally {
      setSaving(false);
    }
  };

  // ── Guardar primero, luego generar PDF y completar ─────────────────────────
  const handleGenerarYCompletar = async () => {
    setGenerating(true);
    try {
      try {
        await guardarLoadsheet(id_vuelo, { ...comb, waypoints });
        setLsEstado("BORRADOR");
      } catch (e) {
        alert("Error al guardar el loadsheet. No se envió.\n" + (e.response?.data?.message || ""));
        return;
      }
      const pdfBlob = await generarPdfLoadsheet(comb, waypoints, vueloInfo);
      await completarLoadsheet(id_vuelo, pdfBlob);
      setLsEstado("COMPLETADO");
      alert("Loadsheet enviado y completado.");
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo completar el loadsheet.");
    } finally {
      setGenerating(false);
    }
  };

  const isReadonly = lsEstado === "BORRADOR" || lsEstado === "COMPLETADO";

  const alumnoNombre = vueloInfo
    ? `${vueloInfo.alumno_nombre ?? ""} ${vueloInfo.alumno_apellido ?? ""}`.trim()
    : "";

  return (
    <div className="ls-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ls-modal">

        {/* ── Encabezado ──────────────────────────────────────────────────── */}
        <div className="ls-header">
          <div className="ls-header-left">
            <h2>
              Loadsheet de Navegación
              {lsEstado && (
                <span className={`ls-badge ls-badge--${lsEstado.toLowerCase()}`}>
                  {lsEstado}
                </span>
              )}
            </h2>
            {vueloInfo && (
              <div className="ls-header-meta">
                {vueloInfo.aeronave_codigo && <span>{vueloInfo.aeronave_codigo}</span>}
                {vueloInfo.aeronave_modelo && <span> · {vueloInfo.aeronave_modelo}</span>}
                {alumnoNombre && <span> · {alumnoNombre}</span>}
              </div>
            )}
          </div>
          <button className="ls-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* ── Cuerpo ──────────────────────────────────────────────────────── */}
        <div className="ls-body">
          {loading ? (
            <p className="ls-loading">Cargando…</p>
          ) : error ? (
            <p className="ls-error">{error}</p>
          ) : (
            <>
              {/* ── Datos fijos del vuelo ─────────────────────────────────── */}
              <div className="ls-section">
                <div className="ls-section-title">Datos del vuelo</div>
                <div className="ls-info-grid">
                  {[
                    ["DEP",     "MSSS"],
                    ["DEST",    "MSSS"],
                    ["REG",     vueloInfo?.aeronave_codigo ?? ""],
                    ["TYPE",    vueloInfo?.aeronave_modelo ?? ""],
                    ["PIC",     alumnoNombre],
                    ["STUDENT", alumnoNombre],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="ls-info-field">
                      <span className="ls-label">{lbl}</span>
                      <span className="ls-info-val">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Combustible ───────────────────────────────────────────── */}
              <div className="ls-section">
                <div className="ls-section-title">Combustible (US gal)</div>
                <div className="ls-fuel-grid">
                  {[
                    { key: "taxi",          label: "TAXI" },
                    { key: "trip",          label: "TRIP" },
                    { key: "rr_5",          label: "R/R 5%" },
                    { key: "alt1_ifr",      label: "ALT 1 (IFR)" },
                    { key: "alt2_ifr",      label: "ALT 2 (IFR)" },
                    { key: "final_reserve", label: "FINAL RESERVE" },
                    { key: "min_req",       label: "MIN REQ" },
                    { key: "extra",         label: "EXTRA" },
                    { key: "tfob",          label: "TFOB" },
                  ].map(({ key, label }) => (
                    <div key={key} className="ls-fuel-field">
                      <span className="ls-label">{label}</span>
                      <input
                        className="ls-input"
                        type="number"
                        min={0}
                        step="0.1"
                        value={comb[key]}
                        onChange={(e) =>
                          setComb((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        disabled={isReadonly}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Waypoints ─────────────────────────────────────────────── */}
              <div className="ls-section">
                <div className="ls-section-title-row">
                  <span className="ls-section-title">Waypoints</span>
                  <button className="ls-btn-add" onClick={agregarFila} disabled={isReadonly}>+ Agregar fila</button>
                </div>
                <div className="ls-table-wrapper">
                  <table className="ls-table">
                    <thead>
                      <tr>
                        {COLS_WP.map(({ key, label }) => (
                          <th key={key} style={{ minWidth: `${COLS_WP.find(c => c.key === key)?.w ?? 40}px` }}>
                            {label}
                          </th>
                        ))}
                        <th className="ls-th-del"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {waypoints.map((wp, idx) => (
                        <tr key={idx}>
                          {COLS_WP.map(({ key }) => (
                            <td key={key}>
                              <input
                                className="ls-cell-input"
                                value={wp[key]}
                                onChange={(e) => setWpField(idx, key, e.target.value)}
                                disabled={isReadonly}
                              />
                            </td>
                          ))}
                          <td>
                            <button
                              className="ls-btn-del"
                              onClick={() => eliminarFila(idx)}
                              title="Eliminar fila"
                              disabled={isReadonly || waypoints.length === 1}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Pie ─────────────────────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="ls-footer">
            <button className="ls-btn" onClick={onClose}>Cerrar</button>

            {/* Sin loadsheet: editable, guardar o completar */}
            {lsEstado === null && (
              <>
                <button
                  className="ls-btn ls-btn--primary"
                  onClick={handleGuardar}
                  disabled={saving || generating}
                >
                  {saving ? "Guardando…" : "Guardar borrador"}
                </button>
                <button
                  className="ls-btn ls-btn--success"
                  onClick={handleGenerarYCompletar}
                  disabled={saving || generating}
                >
                  {generating ? "Generando…" : "Generar y completar"}
                </button>
              </>
            )}

            {/* Borrador: solo lectura, descargar o enviar */}
            {lsEstado === "BORRADOR" && (
              <>
                <button
                  className="ls-btn ls-btn--primary"
                  onClick={handleDescargar}
                  disabled={saving || generating}
                >
                  {saving ? "Generando PDF…" : "Descargar PDF"}
                </button>
                <button
                  className="ls-btn ls-btn--success"
                  onClick={handleGenerarYCompletar}
                  disabled={saving || generating}
                >
                  {generating ? "Enviando…" : "Enviar y completar"}
                </button>
              </>
            )}

            {/* Completado: solo lectura, solo descarga */}
            {lsEstado === "COMPLETADO" && (
              <button
                className="ls-btn ls-btn--primary"
                onClick={handleDescargar}
                disabled={saving || generating}
              >
                {saving ? "Generando PDF…" : "Descargar PDF"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
