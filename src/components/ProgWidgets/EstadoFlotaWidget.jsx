import { useEffect, useState, useCallback } from "react";
import { io as socketIO } from "socket.io-client";
import { getEstadoFlota } from "../../services/programacionApi";
import "./ProgWidgets.css";

const API_URL = window.__APP_CONFIG__?.API_URL ?? "http://localhost:5000";

const ESTADO_LABEL = {
  VOLANDO:      "En vuelo",
  MANTENIMIENTO: "Mantenimiento",
  EN_TIERRA:    "En tierra",
};

const ESTADO_CLS = {
  VOLANDO:      "pw__tag--azul",
  MANTENIMIENTO: "pw__tag--rojo",
  EN_TIERRA:    "pw__tag--gris",
};

export default function EstadoFlotaWidget() {
  const [flota, setFlota]     = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await getEstadoFlota();
      setFlota(data);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const socket = socketIO(API_URL, { transports: ["websocket", "polling"], reconnectionDelay: 1000, reconnectionAttempts: 5 });
    socket.on("vuelo_estado_changed", () => cargar());
    return () => socket.disconnect();
  }, [cargar]);

  const volando      = flota.filter((a) => a.estado_actual === "VOLANDO").length;
  const mantenimiento = flota.filter((a) => a.estado_actual === "MANTENIMIENTO").length;
  const tierra       = flota.filter((a) => a.estado_actual === "EN_TIERRA").length;

  return (
    <div className="pw__widget">
      <div className="pw__widget-header">
        <span className="pw__widget-title">Estado de la flota</span>
        <span className="pw__widget-badge pw__widget-badge--gris">{flota.length} aeronaves</span>
      </div>

      <div className="pw__flota-resumen">
        <span className="pw__flota-stat pw__flota-stat--azul">{volando} volando</span>
        <span className="pw__flota-stat pw__flota-stat--rojo">{mantenimiento} mant.</span>
        <span className="pw__flota-stat pw__flota-stat--gris">{tierra} en tierra</span>
      </div>

      {loading ? (
        <p className="pw__empty">Cargando…</p>
      ) : flota.length === 0 ? (
        <p className="pw__empty">Sin aeronaves registradas.</p>
      ) : (
        <div className="pw__cards">
          {flota.map((a) => {
            const cls = ESTADO_CLS[a.estado_actual] ?? "pw__tag--gris";
            return (
              <div className="pw__card pw__card--flota" key={a.id_aeronave}>
                <div className="pw__card-row">
                  <span className="pw__card-aeronave">{a.codigo}</span>
                  <span className={`pw__tag ${cls}`}>
                    {ESTADO_LABEL[a.estado_actual] ?? a.estado_actual}
                  </span>
                </div>
                <div className="pw__card-sub">
                  {a.modelo} · {a.horas_acumuladas?.toFixed(1) ?? "0.0"} hs acum.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
