import { useEffect, useState } from "react";
import { getCalendarioPublico } from "../../services/programacionApi";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./PaginaProgramacion.css";

/* ── helpers ── */
function jsDayToDb(jsDay) {
  if (jsDay === 0) return null; // domingo, no opera
  return jsDay; // 1(Lun)…6(Sáb)
}

const DIAS = [
  { db: 1, label: "Lunes",      short: "LUN" },
  { db: 2, label: "Martes",     short: "MAR" },
  { db: 3, label: "Miércoles",  short: "MIÉ" },
  { db: 4, label: "Jueves",     short: "JUE" },
  { db: 5, label: "Viernes",    short: "VIE" },
  { db: 6, label: "Sábado",     short: "SÁB" },
];

const ESTADO_META = {
  PROGRAMADO: { label: "Programado", cls: "pp__badge--programado" },
  EN_VUELO:   { label: "En vuelo",   cls: "pp__badge--envuelo"   },
  COMPLETADO: { label: "Completado", cls: "pp__badge--completado" },
};

const formatHora = (h) => h?.slice(0, 5) ?? "—";

export default function PaginaProgramacion() {
  const [vuelos,  setVuelos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  /* día de hoy en formato BD (null si es domingo) */
  const diaHoy = jsDayToDb(new Date().getDay());
  /* tab activo: inicia en el día de hoy, o 1 si es domingo */
  const [tabActivo, setTabActivo] = useState(diaHoy ?? 1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getCalendarioPublico()
      .then((data) => setVuelos(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const vuelosDia = vuelos.filter((v) => Number(v.dia_semana) === tabActivo);

  /* conteo por estado para summary chips */
  const counts = vuelosDia.reduce((acc, v) => {
    acc[v.estado] = (acc[v.estado] ?? 0) + 1;
    return acc;
  }, {});

  const labelDia = DIAS.find((d) => d.db === tabActivo)?.label ?? "";

  return (
    <>
      <Header />

      <main className="pp">

        {/* ── HERO ── */}
        <section className="pp__hero">
          <div className="pp__hero-grid" />
          <div className="pp__hero-glow" />
          <div className="pp__hero-content">
            <p className="pp__eyebrow">Aeropuerto de Ilopango · El Salvador</p>
            <h1 className="pp__hero-title">
              Programación de
              <span className="pp__hero-accent"> vuelos</span>
            </h1>
            <p className="pp__hero-desc">
              Consulta en tiempo real los vuelos programados para la semana en
              curso. Información pública — actualizada automáticamente.
            </p>
          </div>
        </section>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <section className="pp__main">

          {/* Título de sección */}
          <div className="pp__section-head">
            <p className="pp__tag">Semana en curso</p>
            <h2 className="pp__section-title">Calendario semanal</h2>
            <p className="pp__section-sub">
              Solo se muestran vuelos activos (PROGRAMADO / EN VUELO / COMPLETADO).
            </p>
          </div>

          {/* Tabs de días */}
          <div className="pp__daytabs" role="tablist" aria-label="Días de la semana">
            {DIAS.map((dia) => {
              const cnt = vuelos.filter((v) => Number(v.dia_semana) === dia.db).length;
              const isHoy = dia.db === diaHoy;
              const isActive = dia.db === tabActivo;
              return (
                <button
                  key={dia.db}
                  role="tab"
                  aria-selected={isActive}
                  className={`pp__daytab ${isActive ? "pp__daytab--active" : ""} ${isHoy ? "pp__daytab--hoy" : ""}`}
                  onClick={() => setTabActivo(dia.db)}
                >
                  <span className="pp__daytab-short">{dia.short}</span>
                  <span className="pp__daytab-label">{dia.label}</span>
                  {isHoy && <span className="pp__daytab-hoy-badge">Hoy</span>}
                  {!loading && !error && (
                    <span className="pp__daytab-count">{cnt}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div className="pp__panel">

            {/* Panel header */}
            <div className="pp__panel-header">
              <div className="pp__panel-title-row">
                <span className="pp__panel-title">
                  {labelDia}
                  {diaHoy === tabActivo && (
                    <span className="pp__panel-hoy"> · Hoy</span>
                  )}
                </span>
                {!loading && !error && vuelosDia.length > 0 && (
                  <div className="pp__summary-chips">
                    {counts.PROGRAMADO > 0 && (
                      <span className="pp__chip pp__chip--programado">
                        ●&nbsp;{counts.PROGRAMADO} Programado{counts.PROGRAMADO > 1 ? "s" : ""}
                      </span>
                    )}
                    {counts.EN_VUELO > 0 && (
                      <span className="pp__chip pp__chip--envuelo">
                        ●&nbsp;{counts.EN_VUELO} En vuelo
                      </span>
                    )}
                    {counts.COMPLETADO > 0 && (
                      <span className="pp__chip pp__chip--completado">
                        ●&nbsp;{counts.COMPLETADO} Completado{counts.COMPLETADO > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!loading && !error && (
                <p className="pp__panel-sub">
                  {vuelosDia.length > 0
                    ? `${vuelosDia.length} vuelo${vuelosDia.length > 1 ? "s" : ""} programado${vuelosDia.length > 1 ? "s" : ""}`
                    : "Sin vuelos para este día"}
                </p>
              )}
            </div>

            {/* Estado - cargando */}
            {loading && (
              <div className="pp__loading">
                <span className="pp__dot" />
                <span className="pp__dot" />
                <span className="pp__dot" />
                <span>Cargando vuelos…</span>
              </div>
            )}

            {/* Estado - error */}
            {!loading && error && (
              <div className="pp__empty">
                <span className="pp__empty-icon">⚠</span>
                <p>No se pudieron cargar los vuelos. Intenta más tarde.</p>
              </div>
            )}

            {/* Estado - sin vuelos este día */}
            {!loading && !error && vuelosDia.length === 0 && (
              <div className="pp__empty">
                <span className="pp__empty-icon">📋</span>
                <p>No hay vuelos programados para este día.</p>
                <span className="pp__empty-hint">
                  Los vuelos operan de lunes a sábado.
                </span>
              </div>
            )}

            {/* Tabla */}
            {!loading && !error && vuelosDia.length > 0 && (
              <div className="pp__table-wrap">
                <table className="pp__table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Hora</th>
                      <th>Aeronave</th>
                      <th>Alumno</th>
                      <th>Instructor</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vuelosDia.map((v, idx) => {
                      const estado = ESTADO_META[v.estado] ?? { label: v.estado, cls: "" };
                      return (
                        <tr key={v.id_vuelo}>
                          <td className="pp__td--idx">{idx + 1}</td>

                          <td className="pp__td--hora">
                            <span className="pp__hora-main">{formatHora(v.hora_inicio)}</span>
                            <span className="pp__hora-sep">—</span>
                            <span className="pp__hora-fin">{formatHora(v.hora_fin)}</span>
                          </td>

                          <td className="pp__td--aeronave">
                            <span className="pp__aeronave-codigo">{v.aeronave_codigo}</span>
                            <span className="pp__aeronave-modelo">{v.aeronave_modelo}</span>
                          </td>

                          <td className="pp__td--persona">
                            <span className="pp__persona-icon">🎓</span>
                            <span className="pp__persona-nombre">{v.alumno_nombre}</span>
                          </td>

                          <td className="pp__td--persona pp__td--instructor">
                            <span className="pp__persona-icon">👨‍✈️</span>
                            <span className="pp__persona-nombre pp__persona-nombre--sub">
                              {v.instructor_nombre}
                            </span>
                          </td>

                          <td>
                            <span className={`pp__badge ${estado.cls}`}>
                              {estado.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Nota pie */}
          <p className="pp__foot-note">
            ℹ&nbsp; Información correspondiente a la semana en curso · Aeropuerto Internacional de Ilopango · CAAA
          </p>

        </section>
      </main>

      <Footer />
    </>
  );
}
