import { useEffect, useState, useCallback, useRef } from "react";
import { io as socketIO } from "socket.io-client";
import Header from "../../components/Header/Header";
import MetarWidget from "../../components/MetarWidget/MetarWidget";
import {
  getVuelosHoy,
  avanzarEstadoVuelo,
  getEstadoOperaciones,
  setEstadoOperaciones,
} from "../../services/turnoApi";
import "./Dashboard.css";

const API_URL = window.__APP_CONFIG__?.API_URL ?? "http://localhost:5000";

const ESTADO_LABEL = {
  PUBLICADO:      "Programado",
  PROGRAMADO:     "Programado",
  SALIDA_HANGAR:  "Salida hangar",
  EN_VUELO:       "En vuelo",
  REGRESO_HANGAR: "Regreso hangar",
  COMPLETADO:     "Completado",
};

const BTN_LABEL = {
  PUBLICADO:      "Confirmar salida del hangar",
  PROGRAMADO:     "Confirmar salida del hangar",
  SALIDA_HANGAR:  "Confirmar despegue",
  EN_VUELO:       "Confirmar aterrizaje",
  REGRESO_HANGAR: "Completar vuelo",
};

const ESTADO_COLOR = {
  PUBLICADO:      "trn__tag--gris",
  PROGRAMADO:     "trn__tag--gris",
  SALIDA_HANGAR:  "trn__tag--naranja",
  EN_VUELO:       "trn__tag--azul",
  REGRESO_HANGAR: "trn__tag--morado",
  COMPLETADO:     "trn__tag--verde",
};

const MOTIVOS = ["CLIMA", "VIENTO", "VISIBILIDAD", "REVISION_PISTA"];

function hhmmToMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function calcProgreso(vuelo) {
  const { estado, estado_desde, duracion_estimada_min } = vuelo;

  if (estado === "PROGRAMADO" || estado === "PUBLICADO") return 0;

  const activos = ["SALIDA_HANGAR", "EN_VUELO", "REGRESO_HANGAR"];
  if (!activos.includes(estado) || !estado_desde || !duracion_estimada_min) return null;

  const total = 9 + duracion_estimada_min + 9;

  // Minutos acumulados de fases completadas antes de la actual
  const offsetMin = {
    SALIDA_HANGAR:  0,
    EN_VUELO:       9,
    REGRESO_HANGAR: 9 + duracion_estimada_min,
  };

  const elapsed = (Date.now() - new Date(estado_desde).getTime()) / 60000;
  const totalElapsed = offsetMin[estado] + elapsed;

  return Math.min(100, Math.max(0, Math.round((totalElapsed / total) * 100)));
}

function formatHora(h) {
  return h?.slice(0, 5) ?? "";
}

// ── Componente tarjeta de vuelo ────────────────────────────────────────────
function VueloCard({ vuelo, onAvanzar, advancing }) {
  const [progreso, setProgreso] = useState(() => calcProgreso(vuelo));
  const [durInput, setDurInput] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    setProgreso(calcProgreso(vuelo));

    const activo = ["SALIDA_HANGAR", "EN_VUELO", "REGRESO_HANGAR"].includes(vuelo.estado);
    if (!activo) return;

    timerRef.current = setInterval(() => {
      setProgreso(calcProgreso(vuelo));
    }, 15000);

    return () => clearInterval(timerRef.current);
  }, [vuelo.estado, vuelo.estado_desde, vuelo.duracion_estimada_min]);

  const btnLabel = BTN_LABEL[vuelo.estado];
  const tagClass = ESTADO_COLOR[vuelo.estado] ?? "trn__tag--gris";
  const showBar = progreso !== null;

  // Mostrar input solo cuando no hay plan_vuelo y el próximo estado es SALIDA_HANGAR
  const needsDurInput =
    (vuelo.estado === "PROGRAMADO" || vuelo.estado === "PUBLICADO") &&
    !vuelo.tiene_plan_vuelo;

  const handleConfirmar = () => {
    if (needsDurInput) {
      const min = hhmmToMin(durInput || "0:0");
      if (!durInput || min <= 0) return;
      onAvanzar(vuelo.id_vuelo, min);
    } else {
      onAvanzar(vuelo.id_vuelo, null);
    }
  };

  const btnDisabled =
    advancing === vuelo.id_vuelo ||
    (needsDurInput && (!durInput || hhmmToMin(durInput) <= 0));

  return (
    <div className="trn__card">
      <div className="trn__card-top">
        <div className="trn__card-info">
          <span className="trn__aeronave">{vuelo.aeronave_codigo}</span>
          <span className={`trn__tag ${tagClass}`}>{ESTADO_LABEL[vuelo.estado]}</span>
        </div>
        <div className="trn__card-nombres">
          <span className="trn__alumno">
            {vuelo.alumno_nombre} {vuelo.alumno_apellido}
          </span>
          <span className="trn__instructor">
            Inst: {vuelo.instructor_nombre} {vuelo.instructor_apellido}
          </span>
        </div>
      </div>

      {showBar && (
        <div className="trn__bar-wrap">
          <div className="trn__bar" style={{ width: `${progreso}%` }} />
          <span className="trn__bar-pct">{progreso}%</span>
        </div>
      )}

      {needsDurInput && (
        <div className="trn__dur-wrap">
          <label className="trn__dur-label">Tiempo estimado de vuelo (HH:MM)</label>
          <input
            className="trn__dur-input"
            type="text"
            placeholder="01:30"
            value={durInput}
            onChange={(e) => setDurInput(e.target.value)}
          />
        </div>
      )}

      {btnLabel && (
        <button
          className="trn__btn-avanzar"
          disabled={btnDisabled}
          onClick={handleConfirmar}
        >
          {advancing === vuelo.id_vuelo ? "Procesando…" : btnLabel}
        </button>
      )}
    </div>
  );
}

// ── Widget estado de operaciones ────────────────────────────────────────────
function OpsWidget({ ops, onSet }) {
  const [motivo, setMotivo] = useState(ops?.motivo_inactivo ?? "");

  useEffect(() => {
    setMotivo(ops?.motivo_inactivo ?? "");
  }, [ops?.motivo_inactivo]);

  const isActivo = ops?.estado_general === "ACTIVO";

  const toggleOps = () => {
    if (isActivo) {
      onSet("INACTIVO", motivo || MOTIVOS[0]);
    } else {
      onSet("ACTIVO", null);
    }
  };

  return (
    <div className={`trn__ops ${isActivo ? "trn__ops--activo" : "trn__ops--inactivo"}`}>
      <div className="trn__ops-left">
        <span className="trn__ops-dot" />
        <span className="trn__ops-label">
          Operaciones: <strong>{isActivo ? "ACTIVO" : "INACTIVO"}</strong>
        </span>
        {!isActivo && ops?.motivo_inactivo && (
          <span className="trn__ops-motivo">{ops.motivo_inactivo}</span>
        )}
      </div>
      <div className="trn__ops-right">
        {!isActivo && (
          <select
            className="trn__ops-select"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          >
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
        <button className="trn__ops-btn" onClick={toggleOps}>
          {isActivo ? "Suspender operaciones" : "Reanudar operaciones"}
        </button>
      </div>
    </div>
  );
}

// ── Dashboard principal ─────────────────────────────────────────────────────
export default function TurnoDashboard() {
  const [vuelos, setVuelos]     = useState([]);
  const [ops, setOps]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [advancing, setAdvancing] = useState(null);

  const cargarVuelos = useCallback(async () => {
    try {
      const data = await getVuelosHoy();
      setVuelos(data);
    } catch {
      /* silencioso en polling */
    }
  }, []);

  const cargarOps = useCallback(async () => {
    try {
      const data = await getEstadoOperaciones();
      setOps(data);
    } catch {
      /* silencioso */
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    Promise.all([cargarVuelos(), cargarOps()]).finally(() => setLoading(false));
  }, []);

  // Polling 30 s
  useEffect(() => {
    const t = setInterval(cargarVuelos, 30000);
    return () => clearInterval(t);
  }, [cargarVuelos]);

  // Socket.io tiempo real
  useEffect(() => {
    const socket = socketIO(API_URL, { transports: ["websocket", "polling"], reconnectionDelay: 1000, reconnectionAttempts: 5 });

    socket.on("vuelo_estado_changed", ({ id_vuelo, estado, registrado_en, duracion_estimada_min }) => {
      setVuelos((prev) =>
        prev
          .map((v) => {
            if (v.id_vuelo !== id_vuelo) return v;
            const updated = { ...v, estado, estado_desde: registrado_en };
            if (duracion_estimada_min != null) updated.duracion_estimada_min = duracion_estimada_min;
            return updated;
          })
          .filter((v) => v.estado !== "COMPLETADO")
      );
    });

    socket.on("estado_operaciones_changed", (payload) => {
      if (payload && payload.estado_general) {
        setOps(payload);
      } else {
        cargarOps();
      }
    });

    return () => socket.disconnect();
  }, [cargarOps]);

  const handleAvanzar = async (id_vuelo, duracion_estimada_min) => {
    setAdvancing(id_vuelo);
    try {
      await avanzarEstadoVuelo(id_vuelo, duracion_estimada_min);
    } catch (e) {
      alert(e.response?.data?.message || "No se pudo avanzar el estado");
      await cargarVuelos();
    } finally {
      setAdvancing(null);
    }
  };

  const handleSetOps = async (estado_general, motivo_inactivo) => {
    try {
      const data = await setEstadoOperaciones(estado_general, motivo_inactivo);
      setOps(data);
    } catch {
      alert("No se pudo actualizar el estado de operaciones");
    }
  };

  // Agrupar por bloque
  const bloques = [];
  const porBloque = {};
  for (const v of vuelos) {
    const key = v.id_bloque;
    if (!porBloque[key]) {
      porBloque[key] = [];
      bloques.push({ id_bloque: key, hora_inicio: v.hora_inicio, hora_fin: v.hora_fin });
    }
    porBloque[key].push(v);
  }
  bloques.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <>
      <Header />

      <div className="trn">
        {/* ── Cabecera ──────────────────────────────────────────────── */}
        <div className="trn__top">
          <div>
            <p className="trn__eyebrow">Panel de turno</p>
            <h2 className="trn__title">Dashboard operativo</h2>
            <p className="trn__subtitle">
              Vuelos del día · {new Date().toLocaleDateString("es-AR", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
          </div>
          <div className="trn__counter">
            {!loading && (
              <span>{vuelos.length} vuelo{vuelos.length !== 1 ? "s" : ""} activo{vuelos.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* ── METAR ─────────────────────────────────────────────────── */}
        <MetarWidget />

        {/* ── Estado de operaciones ─────────────────────────────────── */}
        {ops && <OpsWidget ops={ops} onSet={handleSetOps} />}

        {/* ── Contenido ─────────────────────────────────────────────── */}
        {loading ? (
          <p className="trn__loading">Cargando…</p>
        ) : vuelos.length === 0 ? (
          <p className="trn__empty">No hay vuelos activos para hoy.</p>
        ) : (
          bloques.map((b) => (
            <div key={b.id_bloque} className="trn__bloque">
              <div className="trn__bloque-header">
                <span className="trn__bloque-hora">
                  {formatHora(b.hora_inicio)} – {formatHora(b.hora_fin)}
                </span>
                <span className="trn__bloque-count">
                  {porBloque[b.id_bloque].length} vuelo{porBloque[b.id_bloque].length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="trn__cards">
                {porBloque[b.id_bloque].map((v) => (
                  <VueloCard
                    key={v.id_vuelo}
                    vuelo={v}
                    onAvanzar={handleAvanzar}
                    advancing={advancing}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
