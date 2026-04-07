import { useLoadSheet } from '../context/LoadSheetContext'

const ALL_STEPS = [
  { label: 'Peso & Balance',            index: 0 },
  { label: 'Navegacion & Combustible',  index: 1 },
  { label: 'Operaciones',               index: 2 },
  { label: 'Resumen & Envio',           index: 3 },
]

export default function StepNav() {
  const { state, dispatch } = useLoadSheet()

  // Si no está soleado, solo mostrar W&B (0) y Resumen (3)
  const steps = state.soleado
    ? ALL_STEPS
    : ALL_STEPS.filter(s => s.index === 0 || s.index === 3)

  return (
    <div className="flex mb-6 border border-gray-300 rounded-md overflow-hidden overflow-x-auto">
      {steps.map((s, i) => (
        <button
          key={s.index}
          onClick={() => dispatch({ type: 'SET_STEP', payload: s.index })}
          className={`flex-1 shrink-0 min-w-[100px] py-2.5 px-2 border-r border-gray-300 last:border-r-0 text-xs font-medium text-center transition-all cursor-pointer ${
            state.step === s.index
              ? 'bg-[#1a3a5c] text-white'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span className="block text-[10px] opacity-70 mb-0.5">PASO {i + 1}</span>
          {s.label}
        </button>
      ))}
    </div>
  )
}
