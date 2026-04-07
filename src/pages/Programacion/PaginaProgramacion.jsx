import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getCalendarioPublico,
  getAeronavesPublicas,
  getBloquesPublicos,
} from "../../services/programacionApi";
import { getMetar } from "../../services/metarApi";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import MetarWidget from "../../components/MetarWidget/MetarWidget";
import EstadoFlotaWidget from "../../components/ProgWidgets/EstadoFlotaWidget";
import MantenimientoResumenWidget from "../../components/ProgWidgets/MantenimientoResumenWidget";
import "./PaginaProgramacion.css";

/* ── helpers ──────────────────────────────────────────────────────────────── */
function jsDayToDb(jsDay) {
  if (jsDay === 0) return null;
  return jsDay;
}

const DIAS = [
  { db: 1, label: "LUNES",     short: "LUN" },
  { db: 2, label: "MARTES",    short: "MAR" },
  { db: 3, label: "MIÉRCOLES", short: "MIÉ" },
  { db: 4, label: "JUEVES",    short: "JUE" },
  { db: 5, label: "VIERNES",   short: "VIE" },
  { db: 6, label: "SÁBADO",    short: "SÁB" },
];

const ESTADO_META = {
  PROGRAMADO: { label: "Programado", cls: "pp__badge--programado" },
  EN_VUELO:   { label: "En vuelo",   cls: "pp__badge--envuelo"   },
  COMPLETADO: { label: "Completado", cls: "pp__badge--completado" },
  CANCELADO:  { label: "Cancelado",  cls: "pp__badge--cancelado"  },
};

const formatHora = (h) => h?.slice(0, 5) ?? "—";

function formatMetarResumen(decoded) {
  if (!decoded) return null;
  const partes = [];
  if (decoded.qnh)         partes.push(`${decoded.qnh.valor} ${decoded.qnh.unidad}`);
  if (decoded.viento)      partes.push(`Viento: ${decoded.viento.texto}`);
  if (decoded.visibilidad) partes.push(`Visib: ${decoded.visibilidad.texto}`);
  if (decoded.temperatura !== null && decoded.temperatura !== undefined)
    partes.push(`Temp: ${decoded.temperatura}°/${decoded.punto_rocio}°C`);
  if (decoded.condicion)   partes.push(decoded.condicion);
  return partes.join("  ·  ");
}

function getEstadoDinamico(v, diaHoy) {
  if (v.estado === "CANCELADO") return "CANCELADO";
  if (Number(v.dia_semana) !== diaHoy) return v.estado || "PROGRAMADO";
  const now = new Date();
  const [hS, mS] = v.hora_inicio.split(":").map(Number);
  const [hE, mE] = v.hora_fin.split(":").map(Number);
  const start = new Date(now); start.setHours(hS, mS, 0, 0);
  const end   = new Date(now); end.setHours(hE, mE, 0, 0);
  if (now < start) return "PROGRAMADO";
  if (now >= start && now < end) return "EN_VUELO";
  return "COMPLETADO";
}

function calcProgreso(v) {
  if (!v.hora_inicio || !v.hora_fin) return 0;
  const now = new Date();
  const [hS, mS] = v.hora_inicio.split(":").map(Number);
  const [hE, mE] = v.hora_fin.split(":").map(Number);
  const start = new Date(now); start.setHours(hS, mS, 0, 0);
  const end   = new Date(now); end.setHours(hE, mE, 0, 0);
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - start) / total) * 100)));
}

function tiempoRestante(v) {
  const now = new Date();
  const [hE, mE] = v.hora_fin.split(":").map(Number);
  const end = new Date(now); end.setHours(hE, mE, 0, 0);
  const diffMin = Math.max(0, Math.floor((end - now) / 60000));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function duracionTotal(v) {
  const [hS, mS] = v.hora_inicio.split(":").map(Number);
  const [hE, mE] = v.hora_fin.split(":").map(Number);
  const mins = (hE * 60 + mE) - (hS * 60 + mS);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ── component ────────────────────────────────────────────────────────────── */
export default function PaginaProgramacion() {
  const [vuelos,      setVuelos]      = useState([]);
  const [aeronavesDb, setAeronavesDb] = useState([]);
  const [bloquesDb,   setBloquesDb]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);

  const [metar,       setMetar]       = useState(null);
  const [clock,       setClock]       = useState("");

  const [filtroInstructor, setFiltroInstructor] = useState("all");
  const [filtrosAeronave,  setFiltrosAeronave]  = useState([]);
  const [filtrosEstado,    setFiltrosEstado]     = useState([]);
  const [filtrosOpen,      setFiltrosOpen]       = useState(false);

  const diaHoy = jsDayToDb(new Date().getDay());
  const [tabActivo,       setTabActivo]       = useState(diaHoy ?? 1);
  const [bloqueFocusIdx,  setBloqueFocusIdx]  = useState(0);

  /* ── clock ── */
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── metar (para top bar) ── */
  const cargarMetar = useCallback(async () => {
    try { setMetar(await getMetar()); } catch { /* silencioso */ }
  }, []);
  useEffect(() => {
    cargarMetar();
    const t = setInterval(cargarMetar, 20 * 60 * 1000);
    return () => clearInterval(t);
  }, [cargarMetar]);

  /* ── data ── */
  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([getCalendarioPublico(), getAeronavesPublicas(), getBloquesPublicos()])
      .then(([vData, aData, bData]) => {
        setVuelos(Array.isArray(vData) ? vData : []);
        setAeronavesDb(Array.isArray(aData) ? aData : []);
        setBloquesDb(Array.isArray(bData) ? bData : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  /* ── derived ── */
  const vuelosConEstado = useMemo(() =>
    vuelos.map(v => ({ ...v, estadoDinamico: getEstadoDinamico(v, diaHoy) })),
    [vuelos, diaHoy]
  );

  const vuelosEnCurso = useMemo(() =>
    vuelosConEstado.filter(v => Number(v.dia_semana) === diaHoy && v.estadoDinamico === "EN_VUELO"),
    [vuelosConEstado, diaHoy]
  );

  const bloquesOrdenados = useMemo(() =>
    [...bloquesDb].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    [bloquesDb]
  );

  /* índice del bloque siguiente al actual */
  useEffect(() => {
    if (!diaHoy || bloquesOrdenados.length === 0) return;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const idx = bloquesOrdenados.findIndex(b => {
      const [h, m] = b.hora_inicio.split(":").map(Number);
      return h * 60 + m > nowMin;
    });
    setBloqueFocusIdx(idx >= 0 ? idx : bloquesOrdenados.length - 1);
  }, [bloquesOrdenados, diaHoy]);

  const bloqueFocus = bloquesOrdenados[bloqueFocusIdx];

  const vuelosSiguienteBloque = useMemo(() => {
    if (!bloqueFocus || !diaHoy) return [];
    return vuelosConEstado.filter(
      v => Number(v.dia_semana) === diaHoy && v.id_bloque === bloqueFocus.id_bloque
    );
  }, [vuelosConEstado, bloqueFocus, diaHoy]);

  const proximosVuelos = useMemo(() =>
    vuelosConEstado
      .filter(v => Number(v.dia_semana) === diaHoy && v.estadoDinamico === "PROGRAMADO")
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
      .slice(0, 5),
    [vuelosConEstado, diaHoy]
  );

  const instructores = useMemo(() => {
    const set = new Set(vuelos.map(v => v.instructor_nombre));
    return Array.from(set).filter(Boolean).sort();
  }, [vuelos]);

  const aeronavesFiltro = useMemo(() =>
    aeronavesDb.map(a => a.modelo).sort(),
    [aeronavesDb]
  );

  const toggleFiltroAeronave = (modelo) =>
    setFiltrosAeronave(prev =>
      prev.includes(modelo) ? prev.filter(m => m !== modelo) : [...prev, modelo]
    );

  const toggleFiltroEstado = (estado) =>
    setFiltrosEstado(prev =>
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );

  const activeFiltersCount =
    filtrosAeronave.length + filtrosEstado.length + (filtroInstructor !== "all" ? 1 : 0);

  const vuelosFiltrados = useMemo(() =>
    vuelosConEstado.filter(v => {
      const matchDia        = Number(v.dia_semana) === tabActivo;
      const matchInstructor = filtroInstructor === "all" || v.instructor_nombre === filtroInstructor;
      const matchAeronave   = filtrosAeronave.length === 0 || filtrosAeronave.includes(v.aeronave_modelo);
      const matchEstado     = filtrosEstado.length === 0 || filtrosEstado.includes(v.estadoDinamico);
      return matchDia && matchInstructor && matchAeronave && matchEstado;
    }),
    [vuelosConEstado, tabActivo, filtroInstructor, filtrosAeronave, filtrosEstado]
  );

  /* ── export ── */
  const exportToExcel = () => {
    const headers = ["HORARIO", "AERONAVE"];
    DIAS.forEach(d => headers.push(`${d.label} - Alumno`, `${d.label} - Instructor`, `${d.label} - Status`));
    const rows = [];
    bloquesDb.forEach(bloque => {
      aeronavesDb.forEach(aero => {
        const row = [`${formatHora(bloque.hora_inicio)} - ${formatHora(bloque.hora_fin)}`, aero.codigo];
        DIAS.forEach(dia => {
          const v = vuelos.find(v =>
            v.id_bloque === bloque.id_bloque &&
            v.id_aeronave === aero.id_aeronave &&
            Number(v.dia_semana) === dia.db
          );
          if (v) {
            const est = getEstadoDinamico(v, diaHoy);
            row.push(v.alumno_nombre, v.instructor_nombre, ESTADO_META[est]?.label || est);
          } else {
            row.push("", "", "");
          }
        });
        rows.push(row);
      });
    });
    const csv = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val || ""}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "programacion_semanal.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <>
      <Header />

      {/* ── Top info bar ── */}
      <div className="pp__topbar">
        <div className="pp__topbar-left">
          <div className="pp__topbar-metar-block">
            <span className="pp__topbar-label">
              METAR INFORMATION · {metar?.decoded?.estacion ?? "MSSS"}
            </span>
            <div className="pp__topbar-decoded-row">
              {metar?.decoded?.condicion && (
                <i className="bi bi-cloud-sun pp__topbar-weather-icon" />
              )}
              <span className="pp__topbar-decoded-text">
                {metar
                  ? (formatMetarResumen(metar.decoded) ?? metar.raw)
                  : "Cargando METAR…"}
              </span>
            </div>
          </div>
        </div>
        <div className="pp__topbar-right">
          <span className="pp__topbar-label">LOCAL TIME</span>
          <span className="pp__topbar-clock">{clock} CST</span>
        </div>
      </div>

      <main className="pp">
        <section className="pp__container">

          {/* ── Page header ── */}
          <div className="pp__page-hdr">
            <div>
              <p className="pp__eyebrow">Aeropuerto de Ilopango · El Salvador</p>
              <h1 className="pp__page-title">
                Programación de <span className="pp__accent">vuelos</span>
              </h1>
            </div>
            <button className="pp__btn-export" onClick={exportToExcel}>
              <i className="bi bi-download" /> Exportar Semana
            </button>
          </div>

          {/* ── Dashboard grid ── */}
          <div className="pp__dashboard-grid">

            {/* ══ Left column ══ */}
            <div className="pp__main-col">

              {/* Vuelos en Curso */}
              <div className="pp__card">
                <div className="pp__card-head">
                  <h2 className="pp__card-title">
                    <i className="bi bi-broadcast-pin" /> Vuelos en Curso
                  </h2>
                  {diaHoy && <span className="pp__card-badge">Hoy</span>}
                </div>

                {loading ? (
                  <p className="pp__tbl-empty">Cargando…</p>
                ) : vuelosEnCurso.length === 0 ? (
                  <p className="pp__tbl-empty">Sin vuelos activos en este momento.</p>
                ) : (
                  <div className="pp__tbl-wrap">
                    <table className="pp__table">
                      <thead>
                        <tr>
                          <th>ID VUELO</th>
                          <th>ESTUDIANTE / INSTRUCTOR</th>
                          <th>AERONAVE</th>
                          <th>ESTADO / PROGRESO</th>
                          <th>SALIDA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vuelosEnCurso.map(v => {
                          const pct  = calcProgreso(v);
                          const rest = tiempoRestante(v);
                          const dur  = duracionTotal(v);
                          return (
                            <tr key={v.id_vuelo}>
                              <td className="pp__tbl-id">
                                VL-{String(v.id_vuelo).padStart(2, "0")}
                              </td>
                              <td>
                                <div className="pp__tbl-person">{v.alumno_nombre}</div>
                                <div className="pp__tbl-sub">Cap. {v.instructor_nombre}</div>
                              </td>
                              <td>
                                <span className="pp__tbl-aero">{v.aeronave_codigo}</span>
                              </td>
                              <td>
                                <div className="pp__tbl-estado-row">
                                  <span className="pp__tbl-badge pp__tbl-badge--envuelo">EN VUELO</span>
                                  <span className="pp__tbl-tiempo">{rest} / {dur}</span>
                                </div>
                                <div className="pp__tbl-bar-wrap">
                                  <div className="pp__tbl-bar" style={{ width: `${pct}%` }} />
                                </div>
                              </td>
                              <td className="pp__tbl-hora">{formatHora(v.hora_inicio)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Siguiente Bloque */}
              {diaHoy && bloqueFocus && (
                <div className="pp__card">
                  <div className="pp__card-head">
                    <h2 className="pp__card-title">
                      <i className="bi bi-clock" /> Siguiente Bloque ({formatHora(bloqueFocus.hora_inicio)} - {formatHora(bloqueFocus.hora_fin)})
                    </h2>
                    <div className="pp__nav-btns">
                      <button
                        className="pp__nav-btn"
                        disabled={bloqueFocusIdx === 0}
                        onClick={() => setBloqueFocusIdx(i => Math.max(0, i - 1))}
                      >
                        <i className="bi bi-chevron-left" />
                      </button>
                      <button
                        className="pp__nav-btn"
                        disabled={bloqueFocusIdx >= bloquesOrdenados.length - 1}
                        onClick={() => setBloqueFocusIdx(i => Math.min(bloquesOrdenados.length - 1, i + 1))}
                      >
                        <i className="bi bi-chevron-right" />
                      </button>
                    </div>
                  </div>

                  {vuelosSiguienteBloque.length === 0 ? (
                    <p className="pp__tbl-empty">Sin vuelos en este bloque.</p>
                  ) : (
                    <div className="pp__slots-row">
                      {vuelosSiguienteBloque.map(v => {
                        const cancelado = v.estadoDinamico === "CANCELADO";
                        return (
                          <div
                            key={v.id_vuelo}
                            className={`pp__slot-card ${cancelado ? "pp__slot-card--warn" : ""}`}
                          >
                            <span className="pp__slot-label">
                              SLOT {formatHora(v.hora_inicio)}
                            </span>
                            <div className="pp__slot-name">{v.alumno_nombre}</div>
                            <div className="pp__slot-inst">Instructor: Cap. {v.instructor_nombre}</div>
                            <div className="pp__slot-bottom">
                              <span className="pp__slot-aero">{v.aeronave_codigo}</span>
                              <span className={`pp__slot-status ${cancelado ? "pp__slot-status--warn" : "pp__slot-status--ok"}`}>
                                {cancelado ? "Cancelado" : "Listo"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Schedule: day tabs + filters + flight list */}
              <div className="pp__card pp__schedule-card">

                {/* Day tabs */}
                <div className="pp__day-tabs">
                  {DIAS.map(dia => (
                    <button
                      key={dia.db}
                      className={`pp__day-tab ${tabActivo === dia.db ? "pp__day-tab--active" : ""} ${diaHoy === dia.db ? "pp__day-tab--hoy" : ""}`}
                      onClick={() => setTabActivo(dia.db)}
                    >
                      <span className="pp__day-tab-short">{dia.short}</span>
                      <span className="pp__day-tab-count">
                        {vuelos.filter(v => Number(v.dia_semana) === dia.db).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Filter bar */}
                <div className="pp__filter-bar">
                  <button
                    className={`pp__filter-toggle ${filtrosOpen ? "active" : ""}`}
                    onClick={() => setFiltrosOpen(o => !o)}
                  >
                    <i className="bi bi-funnel" /> Filtros
                    {activeFiltersCount > 0 && (
                      <span className="pp__filter-badge">{activeFiltersCount}</span>
                    )}
                  </button>
                  {filtroInstructor !== "all" && (
                    <span className="pp__chip">
                      {filtroInstructor}
                      <button onClick={() => setFiltroInstructor("all")}>×</button>
                    </span>
                  )}
                  {filtrosAeronave.map(a => (
                    <span key={a} className="pp__chip">
                      {a}
                      <button onClick={() => toggleFiltroAeronave(a)}>×</button>
                    </span>
                  ))}
                  {filtrosEstado.map(e => (
                    <span key={e} className="pp__chip">
                      {ESTADO_META[e]?.label}
                      <button onClick={() => toggleFiltroEstado(e)}>×</button>
                    </span>
                  ))}
                </div>

                {filtrosOpen && (
                  <div className="pp__filter-panel">
                    <div className="pp__filter-group">
                      <label>INSTRUCTOR</label>
                      <select
                        className="pp__select"
                        value={filtroInstructor}
                        onChange={e => setFiltroInstructor(e.target.value)}
                      >
                        <option value="all">Todos los instructores</option>
                        {instructores.map(ins => (
                          <option key={ins} value={ins}>{ins}</option>
                        ))}
                      </select>
                    </div>
                    <div className="pp__filter-group">
                      <label>AERONAVE</label>
                      <div className="pp__chip-row">
                        {aeronavesFiltro.map(a => (
                          <button
                            key={a}
                            className={`pp__chip-btn ${filtrosAeronave.includes(a) ? "active" : ""}`}
                            onClick={() => toggleFiltroAeronave(a)}
                          >{a}</button>
                        ))}
                      </div>
                    </div>
                    <div className="pp__filter-group">
                      <label>ESTADO</label>
                      <div className="pp__chip-row">
                        {Object.entries(ESTADO_META).map(([key, val]) => (
                          <button
                            key={key}
                            className={`pp__chip-btn pp__chip-btn--${key.toLowerCase()} ${filtrosEstado.includes(key) ? "active" : ""}`}
                            onClick={() => toggleFiltroEstado(key)}
                          >{val.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Panel head */}
                <div className="pp__panel-head">
                  <h2 className="pp__panel-day-title">
                    Vuelos del {DIAS.find(d => d.db === tabActivo)?.label}
                  </h2>
                  {tabActivo === diaHoy && <span className="pp__tag-hoy">HOY</span>}
                </div>

                {/* Flight list */}
                <div className="pp__flights-list">
                  {loading ? (
                    <div className="pp__loading">Cargando vuelos…</div>
                  ) : error ? (
                    <div className="pp__empty-state">Error al cargar datos.</div>
                  ) : vuelosFiltrados.length === 0 ? (
                    <div className="pp__empty-state">No hay vuelos que coincidan con los filtros.</div>
                  ) : (
                    vuelosFiltrados.map(v => {
                      const meta = ESTADO_META[v.estadoDinamico] || { label: v.estadoDinamico, cls: "" };
                      return (
                        <div key={v.id_vuelo} className="pp__flight-card">
                          <div className="pp__flight-time">
                            <span className="pp__time-val">{formatHora(v.hora_inicio)}</span>
                            <span className="pp__time-ampm">
                              {parseInt(v.hora_inicio) >= 12 ? "PM" : "AM"}
                            </span>
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
                              <span className="pp__status-dot" /> {meta.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ══ Right sidebar ══ */}
            <aside className="pp__sidebar">

              {/* METAR decoded (dark card from MetarWidget) */}
              <MetarWidget />

              {/* Estado de la flota */}
              <EstadoFlotaWidget />

              {/* Próximos Vuelos */}
              <div className="pp__sb-card">
                <div className="pp__sb-head">
                  <h3 className="pp__sb-title">
                    <i className="bi bi-airplane" /> Próximos Vuelos
                  </h3>
                  <span className="pp__sb-badge">Hoy</span>
                </div>
                {proximosVuelos.length === 0 ? (
                  <p className="pp__sb-empty">Sin vuelos próximos.</p>
                ) : (
                  <div className="pp__prox-list">
                    {proximosVuelos.map((v, i) => (
                      <div key={v.id_vuelo} className="pp__prox-item">
                        <span className={`pp__prox-dot ${i === 0 ? "pp__prox-dot--active" : ""}`} />
                        <div className="pp__prox-info">
                          <div className="pp__prox-hora">
                            {formatHora(v.hora_inicio)} · <strong>{v.aeronave_codigo}</strong>
                          </div>
                          <div className="pp__prox-sub">{v.alumno_nombre}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Próximo mantenimiento */}
              <MantenimientoResumenWidget />

            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
