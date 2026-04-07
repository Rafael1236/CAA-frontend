import { createContext, useContext, useReducer } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Estado inicial — ac: null hasta que INIT_FROM_API lo hidrate desde la BD
// ─────────────────────────────────────────────────────────────────────────────
const initialState = {
  // Aircraft object adaptado desde wb_plantilla (via plantillaToAC)
  ac: null,

  // Si el alumno está habilitado para vuelo solo: controla si se muestran
  // los pasos de Navegación y Operaciones (pasos 1 y 2 del wizard)
  soleado: false,

  // Paso activo del wizard (0-3)
  step: 0,

  // Datos del vuelo cargados desde la API
  vueloInfo: null,

  // ── Formularios ──────────────────────────────────────────────────────────
  flightData: {
    date: new Date().toISOString().split('T')[0],
    time: '',
    student: '',
    instructor: '',
  },

  // W&B: keyed por station.id (slug generado por plantillaToAC)
  wbInputs: {},
  wbResults: {
    totalW: 0, totalM: 0, cg: 0,
    cgOk: false, overweight: false, allOk: false,
  },
  fuelBurn: '',   // galones quemados estimados (para CG de aterrizaje)

  // Navegación
  navRows: [{}, {}, {}],
  fuelData: {
    power: '', flowGal: '', flowKg: '',
    taxiMin: '', tripMin: '', alt1Min: '', alt2Min: '',
  },
  timesData: { tod: '', ld: '', etd: '', atd: '', eta: '', ata: '', eet: '', total: '' },
  depAtis: '',
  arrAtis: '',
  notes: '',

  // Identificación del vuelo (para PrintSheet y PDF)
  identification: {
    dep: '', dest: '', date: '', reg: '', type: '',
    pic: '', student: '', sign: '',
    tom: '', lm: '', tog: '', lcg: '',
  },

  // Datos operacionales
  opsData: {
    dep:  { ap: '', rwy: '', appr: '', vis: '', ceil: '' },
    dest: { ap: '', rwy: '', appr: '', vis: '', ceil: '' },
    alt:  { ap: '', rwy: '', appr: '', vis: '', ceil: '' },
  },

  // Estado de guardado de cada documento
  wbEstado: null,   // 'BORRADOR' | 'COMPLETADO' | null
  lsEstado: null,   // 'BORRADOR' | 'COMPLETADO' | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // Inicialización desde la API — llamado por FlightPrepModal al montar
    case 'INIT_FROM_API': {
      const { ac, soleado, vueloInfo, savedWB, savedLoadsheet } = action.payload

      // Hidratar wbInputs desde savedWB.pesos_ingresados
      // Está keyed por nombre de estación (formato BD).
      // Lo convertimos a keyed por id (slug) usando la lista de stations del ac adaptado.
      const wbInputs = {}
      if (savedWB?.pesos_ingresados && ac?.stations) {
        for (const station of ac.stations) {
          const savedVal = savedWB.pesos_ingresados[station.nombre]
          if (savedVal != null) {
            wbInputs[station.id] = String(savedVal)
          }
        }
      }

      // Nombres pre-llenados desde vueloInfo
      const alumnoNombre = vueloInfo
        ? `${vueloInfo.alumno_nombre ?? ''} ${vueloInfo.alumno_apellido ?? ''}`.trim()
        : ''
      const instructorNombre = vueloInfo
        ? `${vueloInfo.instructor_nombre ?? ''} ${vueloInfo.instructor_apellido ?? ''}`.trim()
        : ''
      const fechaVuelo = vueloInfo?.fecha_vuelo
        ? String(vueloInfo.fecha_vuelo).slice(0, 10)
        : new Date().toISOString().split('T')[0]
      const horaInicio = vueloInfo?.hora_inicio
        ? String(vueloInfo.hora_inicio).slice(0, 5)   // "HH:MM"
        : ''

      // Consumo desde la plantilla (pre-llenar FuelPlanner)
      const burnGalHr = ac?.fuel_burn_gal_hr ?? null
      const burnKgHr  = burnGalHr && ac?.fuel_lb_gal
        ? ((burnGalHr * ac.fuel_lb_gal) / 2.205).toFixed(1)
        : ''

      return {
        ...initialState,
        ac,
        soleado: soleado === true,
        vueloInfo,

        // Datos del vuelo pre-llenados desde la BD
        flightData: {
          date:       fechaVuelo,
          time:       horaInicio,
          student:    alumnoNombre,
          instructor: instructorNombre,
        },

        // Identificación: matrícula, modelo, fecha y alumno desde la BD (solo lectura)
        identification: {
          ...initialState.identification,
          date:    fechaVuelo,
          reg:     ac?.reg   ?? '',
          type:    ac?.model ?? '',
          pic:     instructorNombre,
          student: alumnoNombre,
        },

        // Configuración de vuelo pre-llenada desde wb_plantilla
        fuelData: {
          ...initialState.fuelData,
          flowGal: burnGalHr != null ? String(burnGalHr) : '',
          flowKg:  burnKgHr,
        },

        // W&B inputs desde los datos guardados
        wbInputs,
        fuelBurn: savedWB?.fuel_burn != null ? String(savedWB.fuel_burn) : '',

        // Estado de documentos
        wbEstado: savedWB?.estado        ?? null,
        lsEstado: savedLoadsheet?.estado ?? null,
      }
    }

    case 'SET_STEP':
      return { ...state, step: action.payload }

    case 'SET_WB_INPUT':
      return { ...state, wbInputs: { ...state.wbInputs, [action.id]: action.value } }

    case 'SET_WB_RESULTS':
      return { ...state, wbResults: action.payload }

    case 'SET_FUEL_BURN':
      return { ...state, fuelBurn: action.payload }

    case 'SET_NAV_ROW': {
      const rows = [...state.navRows]
      rows[action.index] = { ...rows[action.index], [action.col]: action.value }
      return { ...state, navRows: rows }
    }

    case 'ADD_NAV_ROW':
      return { ...state, navRows: [...state.navRows, {}] }

    case 'SET_FUEL_DATA':
      return { ...state, fuelData: { ...state.fuelData, [action.field]: action.value } }

    case 'SET_TIMES':
      return { ...state, timesData: { ...state.timesData, [action.field]: action.value } }

    case 'SET_ATIS':
      return { ...state, [action.field]: action.value }

    case 'SET_NOTES':
      return { ...state, notes: action.payload }

    case 'SET_IDENTIFICATION':
      return { ...state, identification: { ...state.identification, [action.field]: action.value } }

    case 'SET_OPS':
      return {
        ...state,
        opsData: {
          ...state.opsData,
          [action.section]: { ...state.opsData[action.section], [action.field]: action.value },
        },
      }

    case 'SET_WB_ESTADO':
      return { ...state, wbEstado: action.payload }

    case 'SET_LS_ESTADO':
      return { ...state, lsEstado: action.payload }

    default:
      return state
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider y hook
// ─────────────────────────────────────────────────────────────────────────────
const LoadSheetContext = createContext()

export function LoadSheetProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <LoadSheetContext.Provider value={{ state, dispatch }}>
      {children}
    </LoadSheetContext.Provider>
  )
}

export function useLoadSheet() {
  const ctx = useContext(LoadSheetContext)
  if (!ctx) throw new Error('useLoadSheet debe usarse dentro de LoadSheetProvider')
  return ctx
}
