import { useEffect, useState } from "react";
import Header from "../../components/Header/Header";
import {
  getVuelosHoy,
  getVuelosSemana,
  getMisAlumnos,
  habilitarVueloExtra,
} from "../../services/instructorApi";
import "./Dashboard.css";

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const ESTADO_TAG = {
  PUBLICADO:      { label: "Programado",     cls: "ins__tag--gris" },
  PROGRAMADO:     { label: "Programado",     cls: "ins__tag--gris" },
  SALIDA_HANGAR:  { label: "Salida hangar",  cls: "ins__tag--naranja" },
  EN_VUELO:       { label: "En vuelo",       cls: "ins__tag--azul" },
  REGRESO_HANGAR: { label: "Regreso hangar", cls: "ins__tag--morado" },
  COMPLETADO:     { label: "Completado",     cls: "ins__tag--verde" },
  CANCELADO:      { label: "Cancelado",      cls: "ins__tag--rojo" },
};

function formatHora(h) { return h?.slice(0, 5) ?? ""; }

function EstadoTag({ estado }) {
  const { label, cls } = ESTADO_TAG[estado] ?? { label: estado, cls: "ins__tag--gris" };
  return <span className={`ins__tag ${cls}`}>{label}</span>;
}

// ── Tarjeta de vuelo (hoy) ─────────────────────────────────────────────────
function VueloCardHoy({ vuelo }) {
  return (
    <div className="ins__card">
      <div className="ins__card-aeronave">{vuelo.aeronave_codigo}</div>
      <div className="ins__card-alumno">
        {vuelo.alumno_nombre} {vuelo.alumno_apellido}
      </div>
      <EstadoTag estado={vuelo.estado} />
    </div>
  );
}

// ── Fila de vuelo (semana) ─────────────────────────────────────────────────
function VueloFila({ vuelo }) {
  return (
    <tr className="ins__tr">
      <td className="ins__td ins__td--dia">{DIAS[vuelo.dia_semana] ?? vuelo.dia_semana}</td>
      <td className="ins__td ins__td--hora">
        {formatHora(vuelo.hora_inicio)}–{formatHora(vuelo.hora_fin)}
      </td>
      <td className="ins__td">{vuelo.aeronave_codigo}</td>
      <td className="ins__td">
        {vuelo.alumno_nombre} {vuelo.alumno_apellido}
      </td>
      <td className="ins__td">
        <EstadoTag estado={vuelo.estado} />
      </td>
    </tr>
  );
}

// ── Fila de alumno ─────────────────────────────────────────────────────────
function AlumnoFila({ alumno, semana, onGuardado }) {
  const [nuevoLimite, setNuevoLimite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleGuardar = async () => {
    const num = Number(nuevoLimite);
    if (!nuevoLimite.trim()) { setError("Ingresá un valor"); return; }
    if (!Number.isInteger(num) || num < 1) { setError("Debe ser entero positivo"); return; }
    if (num > 6) { setError("Máximo 6"); return; }
    if (num <= alumno.limite_vuelos) {
      setError(`Debe ser > ${alumno.limite_vuelos}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await habilitarVueloExtra(alumno.id_alumno, semana.id_semana, num);
      setNuevoLimite("");
      onGuardado(alumno.id_alumno, num);
    } catch (e) {
      setError(e.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="ins__tr">
      <td className="ins__td">
        <div className="ins__alumno-nombre">
          {alumno.nombre} {alumno.apellido}
        </div>
        {alumno.numero_licencia && (
          <div className="ins__alumno-lic">{alumno.numero_licencia}</div>
        )}
      </td>
      <td className="ins__td ins__td--center">
        {alumno.soleado ? (
          <span className="ins__badge ins__badge--soleado">Soleado</span>
        ) : (
          <span className="ins__badge ins__badge--dual">Dual</span>
        )}
      </td>
      <td className="ins__td ins__td--center">
        <span className="ins__limite">{alumno.limite_vuelos}</span>
      </td>
      <td className="ins__td">
        {semana ? (
          <div className="ins__limite-wrap">
            <input
              className="ins__limite-input"
              type="number"
              min={alumno.limite_vuelos + 1}
              max={6}
              value={nuevoLimite}
              placeholder={String(alumno.limite_vuelos + 1)}
              onChange={(e) => { setNuevoLimite(e.target.value); setError(""); }}
            />
            <button
              className="ins__limite-btn"
              disabled={saving || !nuevoLimite.trim()}
              onClick={handleGuardar}
            >
              {saving ? "…" : "Guardar"}
            </button>
          </div>
        ) : (
          <span className="ins__sin-semana">Sin semana próxima</span>
        )}
        {error && <div className="ins__fila-error">{error}</div>}
      </td>
    </tr>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function InstructorDashboard() {
  const [tab, setTab] = useState("hoy");

  const [vuelosHoy, setVuelosHoy]     = useState([]);
  const [semana, setSemana]           = useState(null);
  const [vuelosSemana, setVuelosSemana] = useState([]);
  const [alumnos, setAlumnos]         = useState([]);
  const [semanaProxima, setSemanaProxima] = useState(null);

  const [loadingHoy, setLoadingHoy]         = useState(true);
  const [loadingSemana, setLoadingSemana]   = useState(false);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);

  // Carga inicial: hoy + alumnos
  useEffect(() => {
    getVuelosHoy()
      .then(setVuelosHoy)
      .catch(() => {})
      .finally(() => setLoadingHoy(false));

    getMisAlumnos()
      .then((data) => {
        setAlumnos(data.alumnos);
        setSemanaProxima(data.semana);
      })
      .catch(() => {})
      .finally(() => setLoadingAlumnos(false));
  }, []);

  // Carga semana al cambiar al tab
  useEffect(() => {
    if (tab !== "semana") return;
    setLoadingSemana(true);
    getVuelosSemana()
      .then((data) => {
        setSemana(data.semana);
        setVuelosSemana(data.vuelos);
      })
      .catch(() => {})
      .finally(() => setLoadingSemana(false));
  }, [tab]);

  const handleGuardado = (id_alumno, nuevoLimite) => {
    setAlumnos((prev) =>
      prev.map((a) => a.id_alumno === id_alumno ? { ...a, limite_vuelos: nuevoLimite } : a)
    );
  };

  // Agrupar vuelos de hoy por bloque
  const bloquesHoy = [];
  const porBloqueHoy = {};
  for (const v of vuelosHoy) {
    const key = v.id_bloque;
    if (!porBloqueHoy[key]) {
      porBloqueHoy[key] = [];
      bloquesHoy.push({ id_bloque: key, hora_inicio: v.hora_inicio, hora_fin: v.hora_fin });
    }
    porBloqueHoy[key].push(v);
  }
  bloquesHoy.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <>
      <Header />

      <div className="ins">
        {/* ── Cabecera ──────────────────────────────────────────────── */}
        <div className="ins__top">
          <div>
            <p className="ins__eyebrow">Panel de instructor</p>
            <h2 className="ins__title">Mi actividad</h2>
            <p className="ins__subtitle">
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
          </div>
        </div>

        {/* ── Tabs vuelos ───────────────────────────────────────────── */}
        <div className="ins__tabs">
          <button
            className={`ins__tab ${tab === "hoy" ? "ins__tab--active" : ""}`}
            onClick={() => setTab("hoy")}
          >
            Hoy
          </button>
          <button
            className={`ins__tab ${tab === "semana" ? "ins__tab--active" : ""}`}
            onClick={() => setTab("semana")}
          >
            Semana actual
          </button>
        </div>

        {/* ── Tab Hoy ───────────────────────────────────────────────── */}
        {tab === "hoy" && (
          <div className="ins__section">
            {loadingHoy ? (
              <p className="ins__loading">Cargando…</p>
            ) : vuelosHoy.length === 0 ? (
              <p className="ins__empty">No tenés vuelos hoy.</p>
            ) : (
              bloquesHoy.map((b) => (
                <div key={b.id_bloque} className="ins__bloque">
                  <div className="ins__bloque-header">
                    <span className="ins__bloque-hora">
                      {formatHora(b.hora_inicio)} – {formatHora(b.hora_fin)}
                    </span>
                    <span className="ins__bloque-count">
                      {porBloqueHoy[b.id_bloque].length} vuelo{porBloqueHoy[b.id_bloque].length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="ins__cards">
                    {porBloqueHoy[b.id_bloque].map((v) => (
                      <VueloCardHoy key={v.id_vuelo} vuelo={v} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab Semana ────────────────────────────────────────────── */}
        {tab === "semana" && (
          <div className="ins__section">
            {loadingSemana ? (
              <p className="ins__loading">Cargando…</p>
            ) : vuelosSemana.length === 0 ? (
              <p className="ins__empty">
                {semana ? "No tenés vuelos esta semana." : "No hay semana activa."}
              </p>
            ) : (
              <>
                {semana && (
                  <p className="ins__semana-label">
                    {new Date(semana.fecha_inicio).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
                    {" — "}
                    {new Date(semana.fecha_fin).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
                  </p>
                )}
                <div className="ins__table-wrap">
                  <table className="ins__table">
                    <thead>
                      <tr>
                        <th className="ins__th">Día</th>
                        <th className="ins__th">Horario</th>
                        <th className="ins__th">Aeronave</th>
                        <th className="ins__th">Alumno</th>
                        <th className="ins__th">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vuelosSemana.map((v) => (
                        <VueloFila key={v.id_vuelo} vuelo={v} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Alumnos asignados ─────────────────────────────────────── */}
        <div className="ins__section ins__section--alumnos">
          <h3 className="ins__section-title">Mis alumnos</h3>
          {semanaProxima && (
            <p className="ins__semana-label">
              Límites para semana{" "}
              {new Date(semanaProxima.fecha_inicio).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
              {" — "}
              {new Date(semanaProxima.fecha_fin).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}
            </p>
          )}

          {loadingAlumnos ? (
            <p className="ins__loading">Cargando alumnos…</p>
          ) : alumnos.length === 0 ? (
            <p className="ins__empty">No tenés alumnos asignados.</p>
          ) : (
            <div className="ins__table-wrap">
              <table className="ins__table">
                <thead>
                  <tr>
                    <th className="ins__th">Alumno</th>
                    <th className="ins__th ins__th--center">Condición</th>
                    <th className="ins__th ins__th--center">Límite actual</th>
                    <th className="ins__th">Nuevo límite (sem. próxima)</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((a) => (
                    <AlumnoFila
                      key={a.id_alumno}
                      alumno={a}
                      semana={semanaProxima}
                      onGuardado={handleGuardado}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
