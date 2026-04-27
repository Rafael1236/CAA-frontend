import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { LoadSheetProvider, useLoadSheet } from './context/LoadSheetContext'
import { plantillaToAC, buildPesosPayload } from '../../utils/plantillaToAC'
import { calcFuel } from '../../utils/fuelCalc'
import {
  getWB, guardarWB, completarWB,
  getLoadsheet, guardarLoadsheet, completarLoadsheet,
} from '../../services/alumnoApi'
import StepNav from './shared/StepNav'
import Step1WB from './steps/Step1WB'
import Step2Nav from './steps/Step2Nav'
import Step3Ops from './steps/Step3Ops'
import Step4Summary from './steps/Step4Summary'
import './FlightPrepModal.css'

// ─────────────────────────────────────────────────────────────────────────────
// Inner — vive dentro del LoadSheetProvider y puede usar useLoadSheet
// ─────────────────────────────────────────────────────────────────────────────
function FlightPrepModalInner({ id_vuelo, soleado, onClose }) {
  const { state, dispatch } = useLoadSheet()
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [emailWarn,  setEmailWarn]  = useState(false)

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [wbData, lsData] = await Promise.all([
          getWB(id_vuelo),
          soleado ? getLoadsheet(id_vuelo) : Promise.resolve(null),
        ])
        if (cancelled) return

        // vueloInfo: preferimos el objeto rico que devuelve getWB (incluye instructor y hora)
        const vueloInfo = wbData.vuelo ?? lsData?.vuelo ?? null

        const ac = plantillaToAC(
          wbData.plantilla,
          wbData.aeronave_codigo,
          vueloInfo?.aeronave_modelo,
        )

        dispatch({
          type: 'INIT_FROM_API',
          payload: {
            ac,
            soleado,
            vueloInfo,
            savedWB:         wbData.wb,
            savedLoadsheet:  lsData?.loadsheet  ?? null,
          },
        })
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.message || e.message || 'Error al cargar datos del vuelo')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id_vuelo, soleado, dispatch])

  // ── Guardar borrador ─────────────────────────────────────────────────────
  const handleGuardarBorrador = async () => {
    if (!state.ac) return
    setSaving(true)
    try {
      await guardarWB(id_vuelo, {
        pesos:         buildPesosPayload(state.wbInputs, state.ac.stations),
        tow:           state.wbResults.totalW || null,
        cg:            state.wbResults.cg     || null,
        momento_total: state.wbResults.totalM || null,
        dentro_limite: state.wbResults.allOk,
      })
      dispatch({ type: 'SET_WB_ESTADO', payload: 'BORRADOR' })

      if (soleado) {
        const fd   = state.fuelData
        const tfob = parseFloat(state.wbInputs.fuel) || 0
        const fuel = calcFuel({
          flowGal: fd.flowGal, flowKg: fd.flowKg,
          taxiMin: fd.taxiMin, tripMin: fd.tripMin,
          alt1Min: fd.alt1Min, alt2Min: fd.alt2Min,
          tfob,
        })
        await guardarLoadsheet(id_vuelo, {
          taxi:          fuel.taxiGal    || null,
          trip:          fuel.tripGal    || null,
          rr_5:          fuel.rarGal     || null,
          alt1_ifr:      fuel.alt1Gal    || null,
          alt2_ifr:      fuel.alt2Gal    || null,
          final_reserve: fuel.reserveGal || null,
          min_req:       fuel.minReqGal  || null,
          extra:         fuel.extraGal   || null,
          tfob:          tfob            || null,
          waypoints:     state.navRows,
        })
        dispatch({ type: 'SET_LS_ESTADO', payload: 'BORRADOR' })
      }
    } catch (err) {
      toast.error('Error al guardar: ' + (err?.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  // ── Completar ────────────────────────────────────────────────────────────
  // onCompletar recibe generatePdfBlob: () => Promise<Blob> desde Step4Summary
  const handleCompletar = async (generatePdfBlob) => {
    setSaving(true)
    try {
      await completarWB(id_vuelo)
      dispatch({ type: 'SET_WB_ESTADO', payload: 'COMPLETADO' })

      if (soleado) {
        const pdfBlob = await generatePdfBlob()
        const result  = await completarLoadsheet(id_vuelo, pdfBlob)
        dispatch({ type: 'SET_LS_ESTADO', payload: 'ENVIADO' })

        if (result?.emailError) {
          setEmailWarn(true)
          setSaving(false)
          return          // deja el modal abierto con el banner amarillo
        }
      }

      onClose()
    } catch (err) {
      toast.error('Error al completar: ' + (err?.response?.data?.message || err.message))
      setSaving(false)
    }
  }

  // ── Badge de estado W&B ──────────────────────────────────────────────────
  const estadoBadge = state.wbEstado
    ? (
      <span className={`fpm-badge fpm-badge--${state.wbEstado.toLowerCase()}`}>
        {state.wbEstado}
      </span>
    )
    : null

  // ── Texto de cabecera ────────────────────────────────────────────────────
  const studentName = state.vueloInfo
    ? `${state.vueloInfo.alumno_nombre ?? ''} ${state.vueloInfo.alumno_apellido ?? ''}`.trim()
    : state.flightData.student

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fpm-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fpm-modal">

        {/* ── Header ── */}
        <div className="fpm-header">
          <div className="fpm-header-left">
            <h2>
              Preparación de Vuelo
              {state.ac && (
                <span style={{ fontWeight: 400, fontSize: '0.85em' }}>
                  {' '}— {state.ac.reg}
                </span>
              )}
              {estadoBadge}
            </h2>
            <div className="fpm-header-meta">
              {studentName && <span>{studentName}</span>}
              {state.flightData.instructor && <span> · Instr: {state.flightData.instructor}</span>}
              {state.flightData.date && <span> · {state.flightData.date}</span>}
              {state.flightData.time && <span> {state.flightData.time}</span>}
              {soleado && <span> · Solo</span>}
            </div>
          </div>

          <div className="fpm-header-actions">
            {!loading && !error && (
              <button
                className="fpm-btn-save"
                onClick={handleGuardarBorrador}
                disabled={saving || !state.ac}
              >
                {saving ? 'Guardando…' : 'Guardar borrador'}
              </button>
            )}
            <button className="fpm-close" onClick={onClose} title="Cerrar">
              ×
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="fpm-body">
          {loading && (
            <div className="fpm-loading">Cargando datos del vuelo…</div>
          )}

          {error && (
            <div className="fpm-error">Error: {error}</div>
          )}

          {emailWarn && (
            <div className="fpm-warning">
              Loadsheet guardado correctamente. El email al instructor no se pudo enviar — intentá de nuevo más tarde.
              <button className="fpm-warning-close" onClick={onClose}>Cerrar</button>
            </div>
          )}

          {!loading && !error && (
            <>
              <StepNav />

              {state.step === 0 && <Step1WB />}
              {state.step === 1 && <Step2Nav />}
              {state.step === 2 && <Step3Ops />}
              {state.step === 3 && (
                <Step4Summary
                  id_vuelo={id_vuelo}
                  saving={saving}
                  onGuardarBorrador={handleGuardarBorrador}
                  onCompletar={handleCompletar}
                />
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper público — monta el Provider antes de renderizar el modal
// ─────────────────────────────────────────────────────────────────────────────
export default function FlightPrepModal({ id_vuelo, soleado, onClose }) {
  return (
    <LoadSheetProvider>
      <FlightPrepModalInner id_vuelo={id_vuelo} soleado={soleado} onClose={onClose} />
    </LoadSheetProvider>
  )
}
