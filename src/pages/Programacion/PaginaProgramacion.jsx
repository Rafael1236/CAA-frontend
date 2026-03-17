import { useEffect, useState, useMemo } from "react";
import { 
  getCalendarioPublico, 
  getAeronavesPublicas, 
  getBloquesPublicos 
} from "../../services/programacionApi";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./PaginaProgramacion.css";

/* ── helpers ── */
function jsDayToDb(jsDay) {
  if (jsDay === 0) return null; // domingo, no opera
  return jsDay; // 1(Lun)…6(Sáb)
}

const DIAS = [
  { db: 1, label: "LUNES",      short: "LUN" },
  { db: 2, label: "MARTES",     short: "MAR" },
  { db: 3, label: "MIÉRCOLES",  short: "MIÉ" },
  { db: 4, label: "JUEVES",     short: "JUE" },
  { db: 5, label: "VIERNES",    short: "VIE" },
  { db: 6, label: "SÁBADO",     short: "SÁB" },
];

const ESTADO_META = {
  PROGRAMADO: { label: "Programado", cls: "pp__badge--programado" },
  EN_VUELO:   { label: "En vuelo",   cls: "pp__badge--envuelo"   },
  COMPLETADO: { label: "Completado", cls: "pp__badge--completado" },
  CANCELADO:  { label: "Cancelado",  cls: "pp__badge--cancelado"  },
};

const formatHora = (h) => h?.slice(0, 5) ?? "—";

function getEstadoDinamico(v, diaHoy) {
  if (v.estado === "CANCELADO") return "CANCELADO";
  if (Number(v.dia_semana) !== diaHoy) return v.estado || "PROGRAMADO";

  const now = new Date();
  const [hStart, mStart] = v.hora_inicio.split(":").map(Number);
  const [hEnd, mEnd] = v.hora_fin.split(":").map(Number);

  const start = new Date(now);
  start.setHours(hStart, mStart, 0, 0);

  const end = new Date(now);
  end.setHours(hEnd, mEnd, 0, 0);

  if (now < start) return "PROGRAMADO";
  if (now >= start && now < end) return "EN_VUELO";
  return "COMPLETADO";
}

export default function PaginaProgramacion() {
  const [vuelos,  setVuelos]  = useState([]);
  const [aeronavesDb, setAeronavesDb] = useState([]);
  const [bloquesDb, setBloquesDb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  // Filtros
  const [filtroInstructor, setFiltroInstructor] = useState("all");
  const [filtrosAeronave, setFiltrosAeronave] = useState([]);
  const [filtrosEstado, setFiltrosEstado] = useState([]);

  const diaHoy = jsDayToDb(new Date().getDay());
  const [tabActivo, setTabActivo] = useState(diaHoy ?? 1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      getCalendarioPublico(),
      getAeronavesPublicas(),
      getBloquesPublicos()
    ])
    .then(([vData, aData, bData]) => {
      setVuelos(Array.isArray(vData) ? vData : []);
      setAeronavesDb(Array.isArray(aData) ? aData : []);
      setBloquesDb(Array.isArray(bData) ? bData : []);
    })
    .catch(() => setError(true))
    .finally(() => setLoading(false));
  }, []);

  const instructores = useMemo(() => {
    const set = new Set(vuelos.map(v => v.instructor_nombre));
    return Array.from(set).filter(Boolean).sort();
  }, [vuelos]);

  // Usamos aeronaves de la DB para los filtros
  const aeronavesFiltro = useMemo(() => {
    return aeronavesDb.map(a => a.modelo).sort();
  }, [aeronavesDb]);

  const toggleFiltroAeronave = (modelo) => {
    setFiltrosAeronave(prev => 
      prev.includes(modelo) ? prev.filter(m => m !== modelo) : [...prev, modelo]
    );
  };

  const toggleFiltroEstado = (estado) => {
    setFiltrosEstado(prev => 
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const vuelosFiltrados = useMemo(() => {
    return vuelos
      .map(v => ({
        ...v,
        estadoDinamico: getEstadoDinamico(v, diaHoy)
      }))
      .filter(v => {
        const matchDia = Number(v.dia_semana) === tabActivo;
        const matchInstructor = filtroInstructor === "all" || v.instructor_nombre === filtroInstructor;
        const matchAeronave = filtrosAeronave.length === 0 || filtrosAeronave.includes(v.aeronave_modelo);
        const matchEstado = filtrosEstado.length === 0 || filtrosEstado.includes(v.estadoDinamico);
        return matchDia && matchInstructor && matchAeronave && matchEstado;
      });
  }, [vuelos, tabActivo, filtroInstructor, filtrosAeronave, filtrosEstado, diaHoy]);

  const exportToExcel = () => {
    // Formato Matriz Semanal
    const headers = ["HORARIO", "AERONAVE"];
    DIAS.forEach(d => {
      headers.push(`${d.label} - Alumno`, `${d.label} - Instructor`, `${d.label} - Status`);
    });

    const rows = [];
    
    // Iterar por cada bloque y aeronave para construir la matriz
    bloquesDb.forEach(bloque => {
      aeronavesDb.forEach(aero => {
        const row = [`${formatHora(bloque.hora_inicio)} - ${formatHora(bloque.hora_fin)}`, aero.codigo];
        
        DIAS.forEach(dia => {
          const vuelo = vuelos.find(v => 
            v.id_bloque === bloque.id_bloque && 
            v.id_aeronave === aero.id_aeronave && 
            Number(v.dia_semana) === dia.db
          );
          
          if (vuelo) {
            const estDin = getEstadoDinamico(vuelo, diaHoy);
            row.push(vuelo.alumno_nombre, vuelo.instructor_nombre, ESTADO_META[estDin]?.label || estDin);
          } else {
            row.push("", "", "");
          }
        });
        
        // Solo agregar fila si tiene al menos un vuelo en la semana? 
        // El usuario dijo "que aparezcan todos", pero para el excel tal vez mejor solo si hay algo.
        // La imagen muestra una matriz completa. Vamos a ponerla completa.
        rows.push(row);
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val || ""}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `programacion_semanal.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Header />


      <main className="pp">
        <section className="pp__hero">
          <div className="pp__hero-grid" />
          <div className="pp__hero-glow" />
          <div className="pp__hero-content">
            <p className="pp__eyebrow">Aeropuerto de Ilopango · El Salvador</p>
            <h1 className="pp__hero-title">
              Programación de <span className="pp__hero-accent">vuelos</span>
            </h1>
            <p className="pp__hero-desc">
              Consulta y gestiona en tiempo real los vuelos programados. Información pública actualizada automáticamente.
            </p>
          </div>
        </section>

        <section className="pp__container">
          <div className="pp__header-actions">
            <div className="pp__tabs-top"></div>
            <div className="pp__top-buttons">
              <button className="pp__btn-export" onClick={exportToExcel}>
                <i className="bi bi-download"></i> Exportar Semana
              </button>
            </div>
          </div>

          <div className="pp__layout">
            <aside className="pp__filters">
              <div className="pp__filter-group">
                <h3 className="pp__filter-title"><i className="bi bi-funnel"></i> Filtros Avanzados</h3>
                
                <div className="pp__filter-item">
                  <label>INSTRUCTORES</label>
                  <select 
                    value={filtroInstructor} 
                    onChange={(e) => setFiltroInstructor(e.target.value)}
                    className="pp__select"
                  >
                    <option value="all">Todos los instructores</option>
                    {instructores.map(ins => (
                      <option key={ins} value={ins}>{ins}</option>
                    ))}
                  </select>
                </div>

                <div className="pp__filter-item">
                  <label>AERONAVES</label>
                  <div className="pp__checkbox-list">
                    {aeronavesFiltro.map(aero => (
                      <label key={aero} className="pp__checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={filtrosAeronave.includes(aero)}
                          onChange={() => toggleFiltroAeronave(aero)}
                        />
                        <span className="pp__custom-checkbox"></span>
                        <span>{aero}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pp__filter-item">
                  <label>ESTADO</label>
                  <div className="pp__status-filters">
                    {Object.entries(ESTADO_META).map(([key, value]) => (
                      <button 
                        key={key}
                        className={`pp__status-btn ${filtrosEstado.includes(key) ? 'active' : ''} pp__status-btn--${key.toLowerCase()}`}
                        onClick={() => toggleFiltroEstado(key)}
                      >
                        {value.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="pp__content">
              <div className="pp__day-grid">
                {DIAS.map((dia) => (
                  <button
                    key={dia.db}
                    className={`pp__day-card ${tabActivo === dia.db ? "pp__day-card--active" : ""}`}
                    onClick={() => setTabActivo(dia.db)}
                  >
                    <span className="pp__day-mini">{tabActivo === dia.db ? 'HOY · ' : ''}{dia.short}</span>
                    <span className="pp__day-name">{dia.label}</span>
                    <span className="pp__day-count">
                      <span className="pp__dot"></span> {vuelos.filter(v => Number(v.dia_semana) === dia.db).length} Vuelos
                    </span>
                  </button>
                ))}
              </div>

              <div className="pp__flights-panel">
                <div className="pp__panel-head">
                  <h2 className="pp__panel-day-title">
                    Vuelos del {DIAS.find(d => d.db === tabActivo)?.label}
                  </h2>
                  {tabActivo === diaHoy && <span className="pp__tag-hoy">HOY</span>}
                </div>

                <div className="pp__flights-list">
                  {loading ? (
                    <div className="pp__loading">Cargando vuelos...</div>
                  ) : error ? (
                    <div className="pp__empty-state">Error al cargar datos.</div>
                  ) : vuelosFiltrados.length === 0 ? (
                    <div className="pp__empty-state">No hay vuelos que coincidan con los filtros.</div>
                  ) : (
                    vuelosFiltrados.map((v) => {
                      const meta = ESTADO_META[v.estadoDinamico] || { label: v.estadoDinamico, cls: "" };
                      return (
                        <div key={v.id_vuelo} className="pp__flight-card">
                          <div className="pp__flight-time">
                            <span className="pp__time-val">{formatHora(v.hora_inicio)}</span>
                            <span className="pp__time-ampm">{parseInt(v.hora_inicio) >= 12 ? 'PM' : 'AM'}</span>
                          </div>

                          <div className="pp__flight-info">
                            <div className="pp__info-col">
                              <span className="pp__info-label">ESTUDIANTE</span>
                              <span className="pp__info-main">{v.alumno_nombre}</span>
                              <span className="pp__info-sub">Estudiante Piloto</span>
                            </div>
                            <div className="pp__info-col">
                              <span className="pp__info-label">INSTRUCTOR</span>
                              <span className="pp__info-main">Cap. {v.instructor_nombre}</span>
                            </div>
                            <div className="pp__info-col">
                              <span className="pp__info-label">AERONAVE</span>
                              <span className="pp__info-main">{v.aeronave_codigo}</span>
                              <span className="pp__info-sub">{v.aeronave_modelo}</span>
                            </div>
                          </div>

                          <div className="pp__flight-status">
                            <span className={`pp__status-badge ${meta.cls}`}>
                              <span className="pp__status-dot"></span> {meta.label}
                            </span>
                            <button className="pp__btn-details">Ver detalles</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
