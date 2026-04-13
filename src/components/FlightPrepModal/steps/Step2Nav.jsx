import { useLoadSheet } from '../context/LoadSheetContext'
import NavTable from '../nav/NavTable'
import FuelPlanner from '../nav/FuelPlanner'
import ActionBar from '../shared/ActionBar'

export default function Step2Nav() {
  const { state, dispatch } = useLoadSheet()
  const ac = state.ac

  const setId   = (field, value) => dispatch({ type: 'SET_IDENTIFICATION', field, value })
  const setTime = (field, value) => dispatch({ type: 'SET_TIMES', field, value })

  const inputCls   = 'w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]'
  const readonlyCls = 'w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-gray-100 text-gray-500'
  const labelCls   = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5'

  return (
    <div>
      <h2 className="text-sm font-bold text-[#1a3a5c] uppercase tracking-wider mb-3">
        Plan de Navegacion
      </h2>

      <div className="overflow-x-auto">
        <NavTable />
      </div>

      <button
        onClick={() => dispatch({ type: 'ADD_NAV_ROW' })}
        className="mb-6 px-3 py-1.5 text-xs font-semibold text-[#1a3a5c] border border-[#1a3a5c] rounded hover:bg-[#e8f0f8] cursor-pointer"
      >
        + Agregar tramo
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Izquierda: Combustible */}
        <div>
          <FuelPlanner />
        </div>

        {/* Derecha: Identificación + Tiempos + ATIS + Notas */}
        <div className="space-y-4">

          {/* Identificación del vuelo */}
          <div>
            <h3 className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider mb-2">
              Identificacion del Vuelo
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>DEP</label>
                <input className={inputCls} value={state.identification.dep} onChange={e => setId('dep', e.target.value)} /></div>
              <div><label className={labelCls}>DEST</label>
                <input className={inputCls} value={state.identification.dest} onChange={e => setId('dest', e.target.value)} /></div>
              <div><label className={labelCls}>DATE</label>
                <input className={readonlyCls} value={state.identification.date || state.flightData.date} readOnly /></div>
              <div><label className={labelCls}>REG</label>
                <input className={readonlyCls} value={ac?.reg || ''} readOnly /></div>
              <div><label className={labelCls}>TYPE</label>
                <input className={readonlyCls} value={ac?.model || ''} readOnly /></div>
              <div><label className={labelCls}>PIC / Instructor</label>
                <input className={readonlyCls} value={state.identification.pic || state.flightData.instructor} readOnly /></div>
              <div><label className={labelCls}>Student</label>
                <input className={readonlyCls} value={state.identification.student || state.flightData.student} readOnly /></div>
              <div><label className={labelCls}>SIGN</label>
                <input className={inputCls} value={state.identification.sign} onChange={e => setId('sign', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div><label className={labelCls}>TOM (lb)</label>
                <input className={inputCls} value={state.identification.tom || Math.round(state.wbResults.totalW) || ''} onChange={e => setId('tom', e.target.value)} /></div>
              <div><label className={labelCls}>LM (lb)</label>
                <input className={inputCls} value={state.identification.lm || Math.round(state.wbResults.ldgW || 0) || ''} onChange={e => setId('lm', e.target.value)} /></div>
              <div><label className={labelCls}>TOG</label>
                <input className={inputCls} value={state.identification.tog || (state.wbResults.cg ? state.wbResults.cg.toFixed(2) : '')} onChange={e => setId('tog', e.target.value)} /></div>
              <div><label className={labelCls}>LCG</label>
                <input className={inputCls} value={state.identification.lcg || (state.wbResults.ldgCG ? state.wbResults.ldgCG.toFixed(2) : '')} onChange={e => setId('lcg', e.target.value)} /></div>
            </div>
          </div>

          {/* Tiempos */}
          <div>
            <h3 className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider mb-2">Tiempos</h3>
            <div className="grid grid-cols-4 gap-2">
              {[['TOD (m)','tod'],['LD (m)','ld'],['ETD','etd'],['ATD','atd'],['ETA','eta'],['ATA','ata'],['EET','eet'],['TOTAL','total']].map(([label, field]) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <input className={inputCls} value={state.timesData[field]} onChange={e => setTime(field, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* ATIS & Notas */}
          <div>
            <h3 className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider mb-2">ATIS & Notas</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className={labelCls}>DEP ATIS</label>
                <input className={inputCls} value={state.depAtis} onChange={e => dispatch({ type: 'SET_ATIS', field: 'depAtis', value: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>ARR ATIS</label>
                <input className={inputCls} value={state.arrAtis} onChange={e => dispatch({ type: 'SET_ATIS', field: 'arrAtis', value: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea
                className={`${inputCls} h-16 resize-none`}
                value={state.notes}
                onChange={e => dispatch({ type: 'SET_NOTES', payload: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <ActionBar
        onBack={() => dispatch({ type: 'SET_STEP', payload: 0 })}
        onNext={() => dispatch({ type: 'SET_STEP', payload: 2 })}
      />
    </div>
  )
}
