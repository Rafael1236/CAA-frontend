import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getWB, guardarWB, completarWB } from "../../services/alumnoApi";
import { plantillaToAC, buildPesosPayload } from "../../utils/plantillaToAC";
import { calcWB, checkCGInEnvelope, fmtMoment } from "../../utils/wbCalc";
import EnvelopeCanvas from "../FlightPrepModal/wb/EnvelopeCanvas";
import "./WeightBalanceModal.css";

export default function WeightBalanceModal({ id_vuelo, onClose }) {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [ac, setAc]               = useState(null);
  const [aeronave, setAeronave]   = useState("");
  const [wbEstado, setWbEstado]   = useState(null);
  const [wbInputs, setWbInputs]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [completing, setCompleting] = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getWB(id_vuelo);
        const acObj = plantillaToAC(data.plantilla, data.aeronave_codigo);
        setAc(acObj);
        setAeronave(data.aeronave_codigo);

        // Inicializar entradas desde pesos guardados (nombre → id)
        const savedPesos = data.wb?.pesos_ingresados ?? {};
        const initial = {};
        for (const s of acObj.stations) {
          const saved = savedPesos[s.nombre];
          if (saved != null) initial[s.id] = String(saved);
        }
        setWbInputs(initial);

        if (data.wb) setWbEstado(data.wb.estado);
      } catch (e) {
        setError(e.response?.data?.message || "No se pudo cargar el Weight & Balance.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id_vuelo]);

  // ── Cálculos en tiempo real ────────────────────────────────────────────────
  const calc = useMemo(() => {
    if (!ac) return null;
    const { totalW, totalM, cg } = calcWB(ac, wbInputs);
    const oilW      = ac.oil?.weight ?? 0;
    const hasData   = totalW > ac.empty_weight + oilW;
    const overweight = totalW > ac.max_gross;
    const hasLimits  = ac.limits_normal?.length >= 2;
    const envCheck   = hasLimits
      ? checkCGInEnvelope(totalW, cg, ac.limits_normal)
      : { inside: true, fwd: null, aft: null };
    const cgOk       = envCheck.inside;
    const allOk      = hasData && !overweight && cgOk;
    const dentro_limite = !overweight && cgOk;

    return { totalW, totalM, cg, hasData, overweight, cgOk, allOk, dentro_limite, envCheck, hasLimits };
  }, [ac, wbInputs]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const setInput = (id, value) =>
    setWbInputs(prev => ({ ...prev, [id]: value }));

  const buildPayload = () => ({
    pesos: buildPesosPayload(wbInputs, ac.stations),
    tow: calc.totalW,
    cg: calc.cg,
    dentro_limite: calc.dentro_limite,
  });

  const handleGuardar = async () => {
    if (!calc) return;
    setSaving(true);
    try {
      await guardarWB(id_vuelo, buildPayload());
      setWbEstado("BORRADOR");
      toast.success("Weight & Balance guardado como borrador.");
    } catch (e) {
      toast.error(e.response?.data?.message || "No se pudo guardar el W&B.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompletar = async () => {
    if (!calc?.dentro_limite) return;
    setCompleting(true);
    try {
      await guardarWB(id_vuelo, buildPayload());
      await completarWB(id_vuelo);
      setWbEstado("COMPLETADO");
      toast.success("Weight & Balance completado.");
    } catch (e) {
      toast.error(e.response?.data?.message || "No se pudo completar el W&B.");
    } finally {
      setCompleting(false);
    }
  };

  // ── Helpers de formato ────────────────────────────────────────────────────
  const fmt = (n) => (typeof n === "number" && isFinite(n) ? n.toFixed(2) : "—");
  const momentHeader = ac?.moment_div1000 ? "Momento (lb·in/1000)" : "Momento (lb·in)";

  // ── Tarjetas de resumen ───────────────────────────────────────────────────
  const cards = calc?.hasData
    ? [
        {
          label: "Peso Bruto",
          value: `${calc.totalW.toLocaleString()} lb`,
          ok: !calc.overweight,
          sub: calc.overweight
            ? `Excede MTOW (${ac.max_gross.toLocaleString()} lb)`
            : `Dentro del límite`,
        },
        {
          label: "CG Cargado",
          value: `${fmt(calc.cg)} in`,
          ok: calc.cgOk,
          sub: calc.hasLimits
            ? (calc.cgOk ? "Dentro de envolvente" : "Fuera de envolvente")
            : "Sin envolvente definida",
        },
        {
          label: "Margen CG",
          value: calc.hasLimits && calc.envCheck.fwd != null
            ? `Fwd ${(calc.cg - calc.envCheck.fwd).toFixed(2)} · Aft ${(calc.envCheck.aft - calc.cg).toFixed(2)}`
            : "—",
          ok: calc.cgOk,
          sub: "Distancia a límites (in)",
        },
        {
          label: "Estado W&B",
          value: calc.allOk ? "APTO ✓" : "REVISAR ✗",
          ok: calc.allOk,
          sub: calc.allOk ? "Listo para vuelo" : "Verificar límites",
        },
      ]
    : null;

  return (
    <div className="wb-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wb-modal">

        {/* ── Encabezado ────────────────────────────────────────────────── */}
        <div className="wb-header">
          <div className="wb-header-left">
            <h2>
              Weight &amp; Balance
              {wbEstado && (
                <span className={`wb-badge wb-badge--${wbEstado.toLowerCase()}`}>
                  {wbEstado}
                </span>
              )}
            </h2>
            {ac && (
              <div className="wb-header-meta">
                {aeronave && <span>{aeronave}</span>}
                <span> · MTOW: {ac.max_gross.toLocaleString()} lbs</span>
                <span> · Brazo en inches</span>
                {ac.oil && <span> · Oil: {ac.oil.weight} lb (fijo)</span>}
              </div>
            )}
          </div>
          <button className="wb-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* ── Cuerpo ────────────────────────────────────────────────────── */}
        <div className="wb-body">
          {loading ? (
            <p className="wb-loading">Cargando…</p>
          ) : error ? (
            <p className="wb-error">{error}</p>
          ) : (
            <>
              {/* Advertencias */}
              {calc?.hasData && calc.overweight && (
                <div className="wb-warning">
                  TOW {fmt(calc.totalW)} lbs supera el MTOW de {ac.max_gross.toLocaleString()} lbs — no se puede completar.
                </div>
              )}
              {calc?.hasData && !calc.cgOk && !calc.overweight && (
                <div className="wb-warning">
                  CG {fmt(calc.cg)} in fuera de la envolvente — verificar cargas.
                </div>
              )}

              <div className="wb-layout">

                {/* ── Columna izquierda: tabla ──────────────────────────── */}
                <div className="wb-layout-left">
                  <table className="wb-table">
                    <thead>
                      <tr>
                        <th>Estación</th>
                        <th>Brazo (in)</th>
                        <th>Peso (lbs)</th>
                        <th>{momentHeader}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fila fija: Empty Weight */}
                      <tr className="wb-row-fixed">
                        <td>Empty Weight</td>
                        <td>{ac.empty_arm}</td>
                        <td>{ac.empty_weight.toLocaleString()}</td>
                        <td>{fmtMoment(ac.empty_moment, ac)}</td>
                      </tr>

                      {/* Fila fija: Oil (solo PA-28 y PA-28R) */}
                      {ac.oil && (
                        <tr className="wb-row-fixed">
                          <td>
                            {ac.oil.label}
                            <span className="wb-fixed-badge">fijo</span>
                          </td>
                          <td>{ac.oil.arm}</td>
                          <td>{ac.oil.weight}</td>
                          <td>{fmtMoment(ac.oil.weight * ac.oil.arm, ac)}</td>
                        </tr>
                      )}

                      {/* Estaciones variables */}
                      {ac.stations.map(s => {
                        const raw    = wbInputs[s.id] ?? "";
                        const numVal = parseFloat(raw) || 0;
                        const weight = s.is_fuel ? numVal * ac.fuel_lb_gal : numVal;
                        const moment = weight * s.arm;
                        const maxVal = s.is_fuel ? s.max_gal : s.max;
                        const isOver = maxVal != null && numVal > maxVal;
                        const isWarn = maxVal != null && !isOver && numVal > maxVal * 0.9;

                        return (
                          <tr key={s.id}>
                            <td className={isOver ? "wb-label-over" : ""}>{s.label}</td>
                            <td>{s.arm}</td>
                            <td>
                              <input
                                className={`wb-input-peso${isOver ? " wb-input-over" : isWarn ? " wb-input-warn" : ""}`}
                                type="number"
                                min={0}
                                step={s.is_fuel ? "0.5" : "1"}
                                value={raw}
                                onChange={e => setInput(s.id, e.target.value)}
                                placeholder={s.is_fuel ? "gal" : "lb"}
                              />
                              {s.is_fuel && raw && (
                                <span className="wb-fuel-conv">= {weight.toFixed(1)} lb</span>
                              )}
                            </td>
                            <td className="wb-momento">
                              {raw ? fmtMoment(moment, ac) : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="wb-row-total">
                        <td colSpan={2}>TOW</td>
                        <td className={calc?.overweight ? "wb-over-limit" : ""}>
                          {calc?.totalW.toLocaleString()} lbs
                        </td>
                        <td>{fmtMoment(calc?.totalM ?? 0, ac)}</td>
                      </tr>
                      <tr className="wb-row-cg">
                        <td colSpan={3}>CG</td>
                        <td>{fmt(calc?.cg ?? 0)} in</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* ── Columna derecha: tarjetas + envolvente ────────────── */}
                <div className="wb-layout-right">
                  {/* Tarjetas de resumen */}
                  {cards && (
                    <div className="wb-cards">
                      {cards.map(c => (
                        <div key={c.label} className={`wb-card${c.ok ? " wb-card--ok" : " wb-card--err"}`}>
                          <div className="wb-card-label">{c.label}</div>
                          <div className="wb-card-value">{c.value}</div>
                          <div className="wb-card-sub">{c.sub}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Envolvente */}
                  {calc?.hasLimits && (
                    <EnvelopeCanvas
                      gw={calc.totalW}
                      cg={calc.cg}
                      limitsNormal={ac.limits_normal}
                      limitsUtility={ac.limits_utility}
                      title="Envolvente Normal W&amp;B"
                      showPoint={calc.hasData}
                    />
                  )}
                </div>

              </div>
            </>
          )}
        </div>

        {/* ── Pie ───────────────────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="wb-footer">
            <button className="wb-btn" onClick={onClose}>Cerrar</button>
            <button
              className="wb-btn wb-btn--primary"
              onClick={handleGuardar}
              disabled={saving || completing}
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              className="wb-btn wb-btn--success"
              onClick={handleCompletar}
              disabled={saving || completing || !calc?.dentro_limite || wbEstado === "COMPLETADO"}
              title={
                !calc?.dentro_limite
                  ? "TOW supera MTOW o CG fuera de envolvente"
                  : wbEstado === "COMPLETADO"
                  ? "Ya completado"
                  : ""
              }
            >
              {completing ? "Completando…" : "Completar"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
