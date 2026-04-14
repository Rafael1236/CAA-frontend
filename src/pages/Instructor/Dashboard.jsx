import { useEffect, useState, useCallback, useRef } from "react";
import { io as socketIO } from "socket.io-client";
import Header from "../../components/Header/Header";
import ToastMantenimiento from "../../components/ToastMantenimiento/ToastMantenimiento";
import ChecklistPostvueloModal from "../../components/ChecklistPostvueloModal/ChecklistPostvueloModal";
import ReporteVueloModal from "../../components/ReporteVueloModal/ReporteVueloModal";
import {
  getVuelosHoy,
  getVuelosSemana,
  getMisAlumnos,
  habilitarVueloExtra,
  avanzarEstadoVuelo,
  getReportesPendientes,
} from "../../services/instructorApi";
import "./Dashboard.css";

const API_URL = window.__APP_CONFIG__?.API_URL ?? "http://localhost:5000";

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const ESTADO_TAG = {
  PUBLICADO:      { label: "Programado",     cls: "ins__tag--gris" },
  PROGRAMADO:     { label: "Programado",     cls: "ins__tag--gris" },
  SALIDA_HANGAR:  { label: "Salida hangar",  cls: "ins__tag--naranja" },
  EN_VUELO:       { label: "En vuelo",       cls: "ins__tag--azul" },
  REGRESO_HANGAR: { label: "Regreso hangar", cls: "ins__tag--morado" },
  FINALIZANDO:    { label: "Finalizando",    cls: "ins__tag--amarillo" },
  COMPLETADO:     { label: "Completado",     cls: "ins__tag--verde" },
  CANCELADO:      { label: "Cancelado",      cls: "ins__tag--rojo" },
};

const BTN_LABEL = {
  PUBLICADO:      "Salida del Hangar",
  PROGRAMADO:     "Salida del Hangar",
  SALIDA_HANGAR:  "En Vuelo",
  EN_VUELO:       "Regreso al Hangar",
  REGRESO_HANGAR: "Finalizando",
};

function formatHora(h) { return h?.slice(0, 5) ?? ""; }

function hhmmToMin(hhmm) {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function calcProgreso(vuelo) {
  const { estado, estado_desde, duracion_estimada_min } = vuelo;

  if (estado === "PUBLICADO" || estado === "PROGRAMADO") return null;
  if (estado === "REGRESO_HANGAR" || estado === "FINALIZANDO") return 100;
  if (estado === "COMPLETADO") return null;

  if (!estado_desde || !duracion_estimada_min) return null;
  if (estado !== "SALIDA_HANGAR" && estado !== "EN_VUELO") return null;

  const total = 9 + duracion_estimada_min + 9;
  const offsetMin = { SALIDA_HANGAR: 0, EN_VUELO: 9 };
  const elapsed = (Date.now() - new Date(estado_desde).getTime()) / 60000;
  const totalElapsed = offsetMin[estado] + elapsed;

  return Math.min(99, Math.max(0, Math.round((totalElapsed / total) * 100)));
}

function EstadoTag({ estado }) {
  const { label, cls } = ESTADO_TAG[estado] ?? { label: estado, cls: "ins__tag--gris" };
  return <span className={`ins__tag ${cls}`}>{label}</span>;
}

// ── Tarjeta de vuelo interactiva (tab Hoy) ─────────────────────────────────
function VueloCard({ vuelo, onAvanzar, onCompletarVuelo, advancing }) {
  const [progreso, setProgreso] = useState(() => calcProgreso(vuelo));
  const [tiempoMin, setTiempoMin] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    setProgreso(calcProgreso(vuelo));

    clearInterval(timerRef.current);
    const activo = ["SALIDA_HANGAR", "EN_VUELO"].includes(vuelo.estado);
    if (!activo) return;

    timerRef.current = setInterval(() => {
      setProgreso(calcProgreso(vuelo));
    }, 15000);

    return () => clearInterval(timerRef.current);
  }, [vuelo.estado, vuelo.estado_desde, vuelo.duracion_estimada_min]);

  const tagInfo = ESTADO_TAG[vuelo.estado] ?? { label: vuelo.estado, cls: "ins__tag--gris" };
  const showBar = progreso !== null;

  const isFinalizando = vuelo.estado === "FINALIZANDO";
  const isCompletado  = vuelo.estado === "COMPLETADO";
  const btnLabel      = BTN_LABEL[vuelo.estado];
  const isAdvancing   = advancing === vuelo.id_vuelo;

  // Bloquear "Salida del Hangar" hasta que comience el bloque
  const esSalidaHangar = vuelo.estado === "PUBLICADO" || vuelo.estado === "PROGRAMADO";
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const bloqueHabilitado = !esSalidaHangar || ahoraMin >= hhmmToMin(vuelo.hora_inicio);

  const handleConfirmar = () => {
    if (isFinalizando) {
      const min = parseInt(tiempoMin, 10);
      if (!min || min <= 0) return;
      onAvanzar(vuelo.id_vuelo, { tiempo_vuelo_min: min });
    } else {
      onAvanzar(vuelo.id_vuelo, {});
    }
  };

  const btnDisabled =
    isAdvancing ||
    !bloqueHabilitado ||
    (isFinalizando && (!tiempoMin || parseInt(tiempoMin, 10) <= 0));

  return (
    <div className="ins__card ins__card--vuelo">
      <div className="ins__card-header">
        <span className="ins__card-aeronave">{vuelo.aeronave_codigo}</span>
        <span className={`ins__tag ${tagInfo.cls}`}>{tagInfo.label}</span>
      </div>
      <div className="ins__card-alumno">
        {vuelo.alumno_nombre} {vuelo.alumno_apellido}
      </div>

      {showBar && (
        <div className="ins__bar-wrap">
          <div className="ins__bar-track">
            <div
              className={`ins__bar${vuelo.estado === "REGRESO_HANGAR" || vuelo.estado === "FINALIZANDO" ? " ins__bar--full" : ""}`}
              style={{ width: `${progreso}%` }}
            />
          </div>
          <span className="ins__bar-pct">{progreso}%</span>
        </div>
      )}

      {isFinalizando && (
        <div className="ins__dur-wrap">
          <label className="ins__dur-label ins__dur-label--required">
            Tiempo de vuelo (minutos)
          </label>
          <input
            className="ins__dur-input"
            type="number"
            min="1"
            placeholder="Ej: 75"
            value={tiempoMin}
            onChange={(e) => setTiempoMin(e.target.value)}
          />
        </div>
      )}

      {isCompletado && vuelo.tiempo_vuelo_min != null && (
        <div className="ins__completado-resumen">
          Tiempo registrado: <strong>{vuelo.tiempo_vuelo_min} min</strong>
        </div>
      )}

      {btnLabel && (
        <button
          className="ins__btn-avanzar"
          disabled={btnDisabled}
          onClick={handleConfirmar}
        >
          {isAdvancing ? "Procesando…" : btnLabel}
        </button>
      )}

      {isFinalizando && (
        <button
          className="ins__btn-avanzar ins__btn-avanzar--completar"
          disabled={isAdvancing || !tiempoMin || parseInt(tiempoMin, 10) <= 0}
          onClick={() => onCompletarVuelo(vuelo, tiempoMin)}
        >
          {isAdvancing ? "Procesando…" : "Completar Vuelo"}
        </button>
      )}
    </div>
  );
}

// ── Tarjeta de vuelo simple (tab Semana) ───────────────────────────────────
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

  const [vuelosHoy, setVuelosHoy]         = useState([]);
  const [semana, setSemana]               = useState(null);
  const [vuelosSemana, setVuelosSemana]   = useState([]);
  const [alumnos, setAlumnos]             = useState([]);
  const [semanaProxima, setSemanaProxima] = useState(null);
  const [advancing, setAdvancing]         = useState(null);

  const [loadingHoy, setLoadingHoy]         = useState(true);
  const [loadingSemana, setLoadingSemana]   = useState(false);
  const [loadingAlumnos, setLoadingAlumnos] = useState(true);

  // Checklist post-vuelo
  const [checklistModal, setChecklistModal] = useState(null); // { vuelo, tiempoMin }

  // Reportes pendientes de firma
  const [reportesPendientes, setReportesPendientes]   = useState([]);
  const [loadingReportes, setLoadingReportes]         = useState(true);
  const [reporteModal, setReporteModal]               = useState(null); // vuelo

  const cargarVuelosHoy = useCallback(async () => {
    try {
      const data = await getVuelosHoy();
      setVuelosHoy(data);
    } catch { /* silencioso en polling */ }
  }, []);

  const cargarReportesPendientes = useCallback(async () => {
    try {
      const data = await getReportesPendientes();
      setReportesPendientes(data);
    } catch { /* silencioso */ }
  }, []);

  // Carga inicial: hoy + alumnos + reportes pendientes
  useEffect(() => {
    Promise.all([
      cargarVuelosHoy().finally(() => setLoadingHoy(false)),
      getMisAlumnos()
        .then((data) => { setAlumnos(data.alumnos); setSemanaProxima(data.semana); })
        .catch(() => {})
        .finally(() => setLoadingAlumnos(false)),
      cargarReportesPendientes().finally(() => setLoadingReportes(false)),
    ]);
  }, [cargarVuelosHoy, cargarReportesPendientes]);

  // Polling 30 s (solo tab hoy)
  useEffect(() => {
    if (tab !== "hoy") return;
    const t = setInterval(cargarVuelosHoy, 30000);
    return () => clearInterval(t);
  }, [tab, cargarVuelosHoy]);

  // Socket.io tiempo real
  useEffect(() => {
    const socket = socketIO(API_URL, {
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("vuelo_estado_changed", ({ id_vuelo, estado, registrado_en, duracion_estimada_min, tiempo_vuelo_min }) => {
      setVuelosHoy((prev) =>
        prev.map((v) => {
          if (v.id_vuelo !== id_vuelo) return v;
          const updated = { ...v, estado, estado_desde: registrado_en };
          if (duracion_estimada_min != null) updated.duracion_estimada_min = duracion_estimada_min;
          if (tiempo_vuelo_min != null) updated.tiempo_vuelo_min = tiempo_vuelo_min;
          return updated;
        })
      );
    });

    return () => socket.disconnect();
  }, []);

  // Carga semana al cambiar al tab
  useEffect(() => {
    if (tab !== "semana") return;
    setLoadingSemana(true);
    getVuelosSemana()
      .then((data) => { setSemana(data.semana); setVuelosSemana(data.vuelos); })
      .catch(() => {})
      .finally(() => setLoadingSemana(false));
  }, [tab]);

  const handleAvanzar = async (id_vuelo, body) => {
    setAdvancing(id_vuelo);
    try {
      const resultado = await avanzarEstadoVuelo(id_vuelo, body);
      setVuelosHoy((prev) =>
        prev.map((v) => {
          if (v.id_vuelo !== resultado.id_vuelo) return v;
          const updated = { ...v, estado: resultado.estado, estado_desde: resultado.registrado_en };
          if (resultado.duracion_estimada_min != null) updated.duracion_estimada_min = resultado.duracion_estimada_min;
          if (resultado.tiempo_vuelo_min != null) updated.tiempo_vuelo_min = resultado.tiempo_vuelo_min;
          return updated;
        })
      );
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo avanzar el estado");
      await cargarVuelosHoy();
    } finally {
      setAdvancing(null);
    }
  };

  const handleAbrirChecklist = (vuelo, tiempoMin) => {
    setChecklistModal({ vuelo, tiempoMin: parseInt(tiempoMin, 10) });
  };

  const handleChecklistCompletado = async () => {
    setChecklistModal(null);
    await cargarVuelosHoy();
    await cargarReportesPendientes();
  };

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
      <ToastMantenimiento />

      {checklistModal && (
        <ChecklistPostvueloModal
          id_vuelo={checklistModal.vuelo.id_vuelo}
          vueloInfo={checklistModal.vuelo}
          tiempoVueloMin={checklistModal.tiempoMin}
          onClose={() => setChecklistModal(null)}
          onCompleted={handleChecklistCompletado}
        />
      )}

      {reporteModal && (
        <ReporteVueloModal
          id_vuelo={reporteModal.id_vuelo}
          mode="instructor"
          onClose={() => { setReporteModal(null); cargarReportesPendientes(); }}
        />
      )}

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
                      <VueloCard
                        key={v.id_vuelo}
                        vuelo={v}
                        onAvanzar={handleAvanzar}
                        onCompletarVuelo={handleAbrirChecklist}
                        advancing={advancing}
                      />
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

        {/* ── Reportes pendientes de firma ──────────────────────────── */}
        <div className="ins__section">
          <h3 className="ins__section-title">
            Reportes pendientes de firma
            {reportesPendientes.length > 0 && (
              <span className="ins__badge-count">{reportesPendientes.length}</span>
            )}
          </h3>
          {loadingReportes ? (
            <p className="ins__loading">Cargando reportes…</p>
          ) : reportesPendientes.length === 0 ? (
            <p className="ins__empty">No hay reportes pendientes de firma.</p>
          ) : (
            <div className="ins__table-wrap">
              <table className="ins__table">
                <thead>
                  <tr>
                    <th className="ins__th">Alumno</th>
                    <th className="ins__th">Aeronave</th>
                    <th className="ins__th">Fecha</th>
                    <th className="ins__th ins__th--center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {reportesPendientes.map((r) => (
                    <tr key={r.id_vuelo} className="ins__tr">
                      <td className="ins__td">
                        {r.alumno_nombre} {r.alumno_apellido}
                      </td>
                      <td className="ins__td">{r.aeronave_codigo}</td>
                      <td className="ins__td">
                        {r.fecha_hora_vuelo
                          ? new Date(r.fecha_hora_vuelo).toLocaleDateString("es-SV", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="ins__td ins__td--center">
                        <button
                          className="ins__btn-reporte"
                          onClick={() => setReporteModal(r)}
                        >
                          Revisar y firmar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
