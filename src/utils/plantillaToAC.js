/**
 * plantillaToAC — convierte una fila de wb_plantilla (formato BD)
 * al schema de aircraft que usan los componentes de FlightPrepModal.
 *
 * @param {object} plantilla  - Fila de wb_plantilla (SELECT * resultado)
 * @param {string} reg        - Matrícula de la aeronave (aeronave.codigo)
 * @param {string} [model]    - Modelo de la aeronave (opcional)
 * @returns {object} Aircraft object compatible con wbCalc, WBTable, EnvelopeCanvas, etc.
 */
export function plantillaToAC(plantilla, reg, model) {
  const fuelLbGal = parseFloat(plantilla.fuel_lb_gal) || 6.0
  const allEstaciones = plantilla.estaciones ?? []

  // Estación de aceite (is_oil o is_fixed) → campo oil del ac object (fijo, no editable)
  const oilEst = allEstaciones.find(s => s.is_oil === true || s.is_fixed === true)
  const oil = oilEst
    ? {
        label:  oilEst.nombre,
        arm:    parseFloat(oilEst.arm),
        weight: parseFloat(oilEst.fixed_weight ?? oilEst.max_weight ?? 0),
      }
    : null

  const fuelCapGal  = parseFloat(plantilla.fuel_capacity_gal) || null
  const fuelUsable  = parseFloat(plantilla.fuel_usable_gal)  || null

  // Generar etiqueta de combustible desde los campos de capacidad de la plantilla
  function fuelLabel(stationNombre) {
    if (fuelCapGal && fuelUsable && fuelCapGal !== fuelUsable)
      return `Fuel (${fuelCapGal} gal cap, ${fuelUsable} usable)`
    if (fuelUsable)
      return `Fuel (${fuelUsable} gal)`
    return stationNombre
  }

  // Estaciones variables (excluye el aceite)
  const stations = allEstaciones
    .filter(s => !s.is_oil && !s.is_fixed)
    .map(s => {
      const id     = toSlug(s.nombre)
      const isFuel = s.is_fuel === true

      // max_gal: se usa directamente si la BD lo trae; si no, se deriva de max_weight/densidad
      const maxGal = isFuel
        ? (s.max_gal ?? (s.max_weight ? s.max_weight / fuelLbGal : undefined))
        : undefined

      return {
        id,                                                                    // slug → key en wbInputs
        label:   isFuel ? fuelLabel(s.nombre) : s.nombre,                     // texto en la tabla
        nombre:  s.nombre,                                                     // nombre original (para guardar pesos)
        arm:     parseFloat(s.arm),
        max:     !isFuel && s.max_weight != null ? parseFloat(s.max_weight) : undefined,
        max_gal: maxGal,
        is_fuel: isFuel,
      }
    })

  return {
    // Identificación
    reg,
    model: model || reg,

    // Pesos estructurales
    empty_weight:  parseFloat(plantilla.empty_weight),
    empty_arm:     parseFloat(plantilla.empty_weight_arm),
    empty_moment:  parseFloat(plantilla.empty_weight_moment),
    max_gross:     parseFloat(plantilla.max_takeoff_weight),
    max_landing:   parseFloat(plantilla.max_landing_weight ?? plantilla.max_takeoff_weight),

    // Combustible
    fuel_lb_gal:       fuelLbGal,
    fuel_capacity_gal: fuelCapGal,
    fuel_usable_gal:   fuelUsable,
    fuel_burn_gal_hr:  parseFloat(plantilla.fuel_burn_gal_hr) || null,
    fuel_burn_note:    plantilla.fuel_burn_note ?? null,

    // Formato de momento (true → dividir por 1000, usado en C-152)
    moment_div1000: plantilla.moment_div1000 === true,

    // Aceite fijo (PA-28 y PA-28R); null deshabilita la fila de Oil en la tabla
    oil,

    // Estaciones de carga variables
    stations,

    // Envolvente de CG
    limits_normal:  plantilla.limits_normal  ?? [],
    limits_utility: plantilla.limits_utility ?? null,
  }
}

/**
 * Convierte un nombre de estación en un id slug válido para usar como key de objeto.
 * Ejemplos:
 *   "Fuel"                    → "fuel"
 *   "Front Seat L & R"        → "front_seat_l_r"
 *   "Baggage #1 (120 lb MAX)" → "baggage_1_120_lb_max"
 */
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Construye el objeto pesos { [nombre]: valor } que espera guardarWB.
 * Convierte las keys de wbInputs (id/slug) de vuelta al nombre original de BD.
 *
 * @param {object} wbInputs   - { [id]: string } desde el state del componente
 * @param {Array}  stations   - Estaciones del ac object (tienen id y nombre)
 * @returns {object}           - { [nombre]: number }
 */
export function buildPesosPayload(wbInputs, stations) {
  const pesos = {}
  for (const station of stations) {
    const raw = wbInputs[station.id]
    if (raw !== '' && raw != null) {
      const val = parseFloat(raw)
      if (!isNaN(val)) {
        pesos[station.nombre] = val
      }
    }
  }
  return pesos
}
