import { useEffect, useState } from "react";
import { getCalendarioPublico } from "../../services/programacionApi";
import "./HomeProgramacion.css";

function jsDayToDb(jsDay) {
  if (jsDay === 0) return null; 
  return jsDay;
}

const DIAS_LABEL = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const formatHora = (h) => h?.slice(0, 5);

const ESTADO_LABEL = {
  PROGRAMADO: "Programado",
  COMPLETADO: "Completado",
  EN_VUELO: "En vuelo",
};

export default function HomeProgramacion() {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("today");

  const now = new Date();
  const jsDayHoy = now.getDay(); 
  const jsDayManana = (jsDayHoy + 1) % 7;

  const diaHoy = jsDayToDb(jsDayHoy);
  const diaManana = jsDayToDb(jsDayManana);

  const diaActivo = tab === "today" ? diaHoy : diaManana;
  const labelHoy = diaHoy ? DIAS_LABEL[diaHoy] : "Hoy";
  const labelManana = diaManana ? DIAS_LABEL[diaManana] : "Mañana";

  useEffect(() => {
    setLoading(true);
    setError(false);
    getCalendarioPublico()
      .then((data) => setVuelos(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const vuelosFiltrados = diaActivo
    ? vuelos.filter((v) => Number(v.dia_semana) === diaActivo)
    : [];

  return (
    <div className="hprog">
      <div className="hprog__header">
        <p className="section__tag">Vuelos de esta semana</p>
        <h2 className="section__title">Programación de vuelos</h2>
        <p className="section__body">
          Consulta los vuelos programados para hoy y mañana en nuestra flota activa.
        </p>
      </div>

      <div className="hprog__tabs">
        <button
          className={`hprog__tab ${tab === "today" ? "hprog__tab--active" : ""}`}
          onClick={() => setTab("today")}
        >
          <span className="hprog__tab-dot" />
          Hoy · {labelHoy}
        </button>
        <button
          className={`hprog__tab ${tab === "tomorrow" ? "hprog__tab--active" : ""}`}
          onClick={() => setTab("tomorrow")}
        >
          <span className="hprog__tab-dot" />
          Mañana · {labelManana}
        </button>
      </div>

      <div className="hprog__body">
        {loading && (
          <div className="hprog__loading">
            <span className="hprog__dot" />
            <span className="hprog__dot" />
            <span className="hprog__dot" />
            Cargando vuelos…
          </div>
        )}

        {!loading && error && (
          <div className="hprog__empty">
            <span className="hprog__empty-icon">⚠</span>
            <p>No se pudieron cargar los vuelos. Intenta más tarde.</p>
          </div>
        )}

        {!loading && !error && diaActivo === null && (
          <div className="hprog__empty">
            <span className="hprog__empty-icon">✈</span>
            <p>Los vuelos operan de lunes a sábado.</p>
          </div>
        )}

        {!loading && !error && diaActivo !== null && vuelosFiltrados.length === 0 && (
          <div className="hprog__empty">
            <span className="hprog__empty-icon">📋</span>
            <p>No hay vuelos programados para {tab === "today" ? "hoy" : "mañana"}.</p>
          </div>
        )}

        {!loading && !error && vuelosFiltrados.length > 0 && (
          <div className="hprog__table-wrap">
            <table className="hprog__table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Aeronave</th>
                  <th>Alumno</th>
                  <th>Instructor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {vuelosFiltrados.map((v) => (
                  <tr key={v.id_vuelo}>
                    <td className="hprog__td--hora">
                      {formatHora(v.hora_inicio)}
                      <span className="hprog__hora-sep">–</span>
                      {formatHora(v.hora_fin)}
                    </td>
                    <td>
                      <span className="hprog__aeronave">{v.aeronave_codigo}</span>
                      <span className="hprog__modelo">{v.aeronave_modelo}</span>
                    </td>
                    <td className="hprog__nombre">{v.alumno_nombre}</td>
                    <td className="hprog__nombre hprog__nombre--sub">{v.instructor_nombre}</td>
                    <td>
                      <span className={`hprog__badge hprog__badge--${v.estado}`}>
                        {ESTADO_LABEL[v.estado] ?? v.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="hprog__footer-note">
        <span>ℹ</span> Solo se muestran vuelos de la semana en curso · Aeropuerto de Ilopango
      </p>
    </div>
  );
}
