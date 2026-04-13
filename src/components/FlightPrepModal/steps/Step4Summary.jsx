import { useState } from 'react'
import { toJpeg } from 'html-to-image'
import jsPDF from 'jspdf'
import { useLoadSheet } from '../context/LoadSheetContext'
import StatusStrip from '../shared/StatusStrip'
import ActionBar from '../shared/ActionBar'
import PrintSheet from '../print/PrintSheet'

export default function Step4Summary({ id_vuelo, saving, onGuardarBorrador, onCompletar }) {
  const { state, dispatch } = useLoadSheet()
  const ac = state.ac
  const wb = state.wbResults
  const [showPrint, setShowPrint] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Paso anterior según soleado
  const prevStep = state.soleado ? 2 : 0

  const handleDownloadPDF = async () => {
    if (!showPrint) setShowPrint(true)
    setPdfLoading(true)
    // Esperar dos frames + 800ms para que los canvas terminen de dibujar
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 800)))
    )
    try {
      const el = document.getElementById('print-area')
      if (!el) {
        setPdfLoading(false)
        alert('Activa la vista previa primero.')
        return
      }
      const dataUrl = await toJpeg(el, { quality: 0.93, pixelRatio: 1.5, backgroundColor: '#ffffff' })
      // A4 landscape: 297 × 210 mm
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
      const margin = 8
      const pageW = 297, pageH = 210
      const maxW = pageW - margin * 2, maxH = pageH - margin * 2
      const ratio = el.offsetHeight / el.offsetWidth
      let imgW = maxW, imgH = imgW * ratio
      if (imgH > maxH) { imgH = maxH; imgW = imgH / ratio }
      const xOff = margin + (maxW - imgW) / 2
      const yOff = margin + (maxH - imgH) / 2
      pdf.addImage(dataUrl, 'JPEG', xOff, yOff, imgW, imgH)
      pdf.save(`loadsheet-${ac?.reg || 'caaa'}.pdf`)
    } catch (err) {
      alert('Error generando PDF: ' + (err?.message || String(err)))
    }
    setPdfLoading(false)
  }

  // Generar blob de PDF para completarLoadsheet
  const generatePdfBlob = async () => {
    if (!showPrint) setShowPrint(true)
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 800)))
    )
    const el = document.getElementById('print-area')
    if (!el) throw new Error('print-area no encontrado')
    const dataUrl = await toJpeg(el, { quality: 0.93, pixelRatio: 1.5, backgroundColor: '#ffffff' })
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
    const margin = 8
    const pageW = 297, pageH = 210
    const maxW = pageW - margin * 2, maxH = pageH - margin * 2
    const ratio = el.offsetHeight / el.offsetWidth
    let imgW = maxW, imgH = imgW * ratio
    if (imgH > maxH) { imgH = maxH; imgW = imgH / ratio }
    pdf.addImage(dataUrl, 'JPEG', margin + (maxW - imgW) / 2, margin + (maxH - imgH) / 2, imgW, imgH)
    return pdf.output('blob')
  }

  const summaryRows = [
    ['Aeronave',   ac ? `${ac.reg} — ${ac.model}` : '—'],
    ['Alumno',     state.flightData.student || '—'],
    ['Fecha',      state.flightData.date || '—'],
    ['Peso Bruto', wb.totalW ? `${wb.totalW.toLocaleString()} lb` : '—'],
    ['CG',         wb.cg ? `${wb.cg.toFixed(2)} in` : '—'],
    ['W&B',        wb.allOk ? 'APTO ✓' : wb.totalW > 0 ? 'REVISAR ✗' : 'Sin datos'],
    ['Borrador W&B',  state.wbEstado ?? 'No guardado'],
    ...(state.soleado ? [['Borrador Loadsheet', state.lsEstado ?? 'No guardado']] : []),
  ]

  const canCompletar = wb.allOk && state.wbEstado !== 'COMPLETADO'

  return (
    <div>
      <StatusStrip
        isApto={wb.allOk ? true : wb.totalW > 0 ? false : null}
        message={wb.allOk
          ? 'Peso y balance APTO — listo para completar'
          : wb.totalW > 0
            ? 'Peso y balance requiere revision — no se puede completar'
            : undefined}
      />

      <h2 className="text-sm font-bold text-[#1a3a5c] uppercase tracking-wider mb-3">
        Resumen del Load Sheet
      </h2>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border border-gray-300 rounded overflow-hidden">
          <tbody>
            {summaryRows.map(([label, value], i) => (
              <tr key={label} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="px-3 py-2 font-semibold text-gray-600 w-44">{label}</td>
                <td className="px-3 py-2">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowPrint(!showPrint)}
          className="px-4 py-2 rounded-md text-sm font-semibold border border-[#1a3a5c] text-[#1a3a5c] hover:bg-[#e8f0f8] cursor-pointer"
        >
          {showPrint ? 'Ocultar vista previa' : 'Vista previa e impresion'}
        </button>

        {showPrint && (
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-gray-600 text-white hover:bg-gray-700 cursor-pointer"
          >
            Imprimir
          </button>
        )}

        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-[#1a3a5c] text-white hover:bg-[#122b46] disabled:opacity-50 cursor-pointer"
        >
          {pdfLoading ? 'Generando PDF…' : 'Descargar PDF'}
        </button>

        <button
          onClick={onGuardarBorrador}
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-semibold border border-gray-400 text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Guardando…' : 'Guardar borrador'}
        </button>

        <button
          onClick={() => onCompletar(generatePdfBlob)}
          disabled={!canCompletar || saving}
          title={!canCompletar ? (state.wbEstado === 'COMPLETADO' ? 'Ya completado' : 'W&B fuera de límites') : ''}
          className="px-6 py-2 rounded-md text-sm font-semibold bg-[#15803d] text-white hover:bg-[#166534] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Completar
        </button>
      </div>

      {/* Vista previa inline */}
      {showPrint && (
        <div className="overflow-x-auto bg-gray-200 rounded-lg p-4 mb-4">
          <div className="min-w-[960px] bg-white shadow-md mx-auto">
            <PrintSheet />
          </div>
        </div>
      )}

      <ActionBar
        onBack={() => dispatch({ type: 'SET_STEP', payload: prevStep })}
      />
    </div>
  )
}
