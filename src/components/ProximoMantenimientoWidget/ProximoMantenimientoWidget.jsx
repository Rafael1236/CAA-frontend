import "./ProximoMantenimientoWidget.css";

function formatFecha(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProximoMantenimientoWidget({ data }) {
  if (!data) {
    return (
      <div className="pmw">
        <div className="pmw__header">
          <span className="pmw__title">Mantenimiento</span>
        </div>
        <div className="pmw__body pmw__body--empty">
          Sin datos de mantenimiento disponibles.
        </div>
      </div>
    );
  }

  const horasRestantes = Number(data.horas_restantes ?? 0);
  const porcentaje = data.horas_proxima_revision > 0
    ? Math.min(100, Math.round((data.horas_acumuladas / data.horas_proxima_revision) * 100))
    : 0;

  const nivel = porcentaje >= 90 ? "critico" : porcentaje >= 75 ? "alerta" : "ok";

  return (
    <div className="pmw">
      <div className="pmw__header">
        <span className="pmw__title">Mantenimiento</span>
        <span className={`pmw__level pmw__level--${nivel}`}>
          {nivel === "critico" ? "Crítico" : nivel === "alerta" ? "Alerta" : "OK"}
        </span>
      </div>

      <div className="pmw__body">
        <div className="pmw__aeronave">{data.aeronave_codigo}</div>

        <div className="pmw__progress-wrap">
          <div className="pmw__progress-bar">
            <div
              className={`pmw__progress-fill pmw__progress-fill--${nivel}`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className="pmw__progress-pct">{porcentaje}%</span>
        </div>

        <div className="pmw__rows">
          <div className="pmw__row">
            <span className="pmw__row-label">Horas acumuladas</span>
            <span className="pmw__row-value">{Number(data.horas_acumuladas).toFixed(1)} h</span>
          </div>
          <div className="pmw__row">
            <span className="pmw__row-label">Próxima revisión en</span>
            <span className={`pmw__row-value${nivel !== "ok" ? " pmw__row-value--warn" : ""}`}>
              {horasRestantes.toFixed(1)} h restantes
            </span>
          </div>
          {data.tipo_proxima_revision && (
            <div className="pmw__row">
              <span className="pmw__row-label">Tipo</span>
              <span className="pmw__row-value">{data.tipo_proxima_revision}</span>
            </div>
          )}
          {data.proximo_fecha && (
            <div className="pmw__row">
              <span className="pmw__row-label">Fecha programada</span>
              <span className="pmw__row-value">{formatFecha(data.proximo_fecha)}</span>
            </div>
          )}
          {data.proximo_tipo && (
            <div className="pmw__row">
              <span className="pmw__row-label">Tipo de mantenimiento</span>
              <span className="pmw__row-value">{data.proximo_tipo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
