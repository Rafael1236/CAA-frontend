import { useEffect, useState } from "react";
import {
  getEventosWebhookDisponibles,
  getWebhooks,
  getWebhookById,
  createWebhook,
  updateWebhook,
  updateWebhookEventos,
  testWebhook,
} from "../../services/adminApi";
import "./WebhookConfigModal.css";

const initialForm = {
  nombre: "",
  url: "",
  secret_token: "",
  activo: true,
  timeout_ms: 5000,
};

export default function WebhookConfigModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [webhooks, setWebhooks] = useState([]);
  const [eventosDisponibles, setEventosDisponibles] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [eventosActivos, setEventosActivos] = useState([]);

  const [modoEdicion, setModoEdicion] = useState(false);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [lista, eventos] = await Promise.all([
        getWebhooks(),
        getEventosWebhookDisponibles(),
      ]);

      setWebhooks(lista);
      setEventosDisponibles(eventos);
    } catch (e) {
      alert(e.response?.data?.message || "Error cargando webhooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    cargarTodo();
  }, [open]);

  const limpiarFormulario = () => {
    setSelectedId(null);
    setModoEdicion(false);
    setForm(initialForm);
    setEventosActivos([]);
  };

  const seleccionarWebhook = async (id) => {
    try {
      setLoading(true);
      const data = await getWebhookById(id);

      setSelectedId(data.id_webhook);
      setModoEdicion(true);
      setForm({
        nombre: data.nombre || "",
        url: data.url || "",
        secret_token: data.secret_token || "",
        activo: !!data.activo,
        timeout_ms: data.timeout_ms || 5000,
      });

      setEventosActivos(
        (data.eventos || [])
          .filter((e) => e.activo)
          .map((e) => e.evento)
      );
    } catch (e) {
      alert(e.response?.data?.message || "Error cargando detalle del webhook");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleEvento = (evento) => {
    setEventosActivos((prev) =>
      prev.includes(evento)
        ? prev.filter((ev) => ev !== evento)
        : [...prev, evento]
    );
  };

  const guardar = async () => {
    try {
      setSaving(true);

      if (!form.nombre.trim()) {
        alert("El nombre es obligatorio");
        return;
      }

      if (!form.url.trim()) {
        alert("La URL es obligatoria");
        return;
      }

      const payload = {
        ...form,
        timeout_ms: Number(form.timeout_ms) || 5000,
      };

      let webhookId = selectedId;

      if (!modoEdicion) {
        const resp = await createWebhook({
          ...payload,
          eventos: eventosActivos,
        });

        webhookId = resp.webhook.id_webhook;
        alert("Webhook creado correctamente");
      } else {
        await updateWebhook(webhookId, payload);
        await updateWebhookEventos(webhookId, eventosActivos);
        alert("Webhook actualizado correctamente");
      }

      await cargarTodo();

      if (webhookId) {
        await seleccionarWebhook(webhookId);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Error guardando webhook");
    } finally {
      setSaving(false);
    }
  };

  const probar = async () => {
    if (!selectedId) {
      alert("Primero seleccioná o guardá un webhook");
      return;
    }

    try {
      setSaving(true);
      const resp = await testWebhook(selectedId);

      alert(
        `Prueba ejecutada\nEstado HTTP: ${resp.status}\nOK: ${resp.ok ? "Sí" : "No"}`
      );
    } catch (e) {
      alert(e.response?.data?.message || "Error probando webhook");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="webhook-modal-backdrop">
      <div className="webhook-modal">
        <div className="webhook-modal__header">
          <div>
            <h2>Configuración de Webhooks</h2>
            <p>Conectá tu sistema con n8n y elegí qué eventos enviar.</p>
          </div>

          <button onClick={onClose}>Cerrar</button>
        </div>

        <div className="webhook-modal__body">
          <div className="webhook-modal__sidebar">
            <div className="webhook-modal__sidebar-top">
              <button onClick={limpiarFormulario}>+ Nuevo webhook</button>
            </div>

            {loading ? (
              <p>Cargando...</p>
            ) : webhooks.length === 0 ? (
              <p>No hay webhooks registrados.</p>
            ) : (
              <div className="webhook-list">
                {webhooks.map((w) => (
                  <button
                    key={w.id_webhook}
                    className={`webhook-list__item ${
                      selectedId === w.id_webhook ? "active" : ""
                    }`}
                    onClick={() => seleccionarWebhook(w.id_webhook)}
                  >
                    <strong>{w.nombre}</strong>
                    <span>{w.activo ? "Activo" : "Inactivo"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="webhook-modal__content">
            <div className="webhook-form">
              <div>
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: n8n correos"
                />
              </div>

              <div>
                <label>URL webhook</label>
                <input
                  type="text"
                  name="url"
                  value={form.url}
                  onChange={handleChange}
                  placeholder="https://tu-n8n.com/webhook/..."
                />
              </div>

              <div>
                <label>Token secreto</label>
                <input
                  type="text"
                  name="secret_token"
                  value={form.secret_token}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label>Timeout (ms)</label>
                <input
                  type="number"
                  name="timeout_ms"
                  value={form.timeout_ms}
                  onChange={handleChange}
                  min="1000"
                />
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                  />
                  Activo
                </label>
              </div>
            </div>

            <div className="webhook-events">
              <h3>Eventos disponibles</h3>

              {eventosDisponibles.length === 0 ? (
                <p>No hay eventos disponibles.</p>
              ) : (
                <div className="webhook-events__list">
                  {eventosDisponibles.map((evento) => (
                    <label key={evento}>
                      <input
                        type="checkbox"
                        checked={eventosActivos.includes(evento)}
                        onChange={() => toggleEvento(evento)}
                      />
                      {evento}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="webhook-actions">
              <button onClick={guardar} disabled={saving}>
                {saving ? "Guardando..." : modoEdicion ? "Actualizar" : "Crear"}
              </button>

              <button onClick={probar} disabled={saving || !selectedId}>
                Probar webhook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}