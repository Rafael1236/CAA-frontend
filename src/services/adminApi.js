import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

function getUserHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  return { "x-user": JSON.stringify(user) };
}

export const getCalendarioAdmin = async (week = "next") => {
  const res = await axios.get(`${API_URL}/admin/calendario`, {
    params: { week },
    headers: getUserHeader(),
  });
  return res.data;
};

export const guardarCambiosAdmin = async (moves) => {
  const res = await axios.put(
    `${API_URL}/admin/guardar-cambios`,
    { moves },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const publicarSemana = async () => {
  const res = await axios.post(
    `${API_URL}/admin/publicar-semana`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getAeronavesActivasAdmin = async () => {
  const res = await axios.get(`${API_URL}/admin/aeronaves`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getBloquesHorario = async () => {
  const res = await axios.get(
    `${API_URL}/admin/bloques-horario`,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getBloquesBloqueadosAdmin = async () => {
  const res = await axios.get(`${API_URL}/admin/bloques-bloqueados`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const cancelarVueloAdmin = async (id_vuelo, motivo = null) => {
  const res = await axios.patch(
    `${API_URL}/admin/vuelos/${id_vuelo}/cancelar`,
    motivo ? { motivo } : {},
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getEventosWebhookDisponibles = async () => {
  const res = await axios.get(`${API_URL}/webhooks/eventos-disponibles`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getWebhooks = async () => {
  const res = await axios.get(`${API_URL}/webhooks`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getWebhookById = async (id) => {
  const res = await axios.get(`${API_URL}/webhooks/${id}`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const createWebhook = async (data) => {
  const res = await axios.post(`${API_URL}/webhooks`, data, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const updateWebhook = async (id, data) => {
  const res = await axios.put(`${API_URL}/webhooks/${id}`, data, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const updateWebhookEventos = async (id, eventos) => {
  const res = await axios.put(
    `${API_URL}/webhooks/${id}/eventos`,
    { eventos },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const testWebhook = async (id) => {
  const res = await axios.post(
    `${API_URL}/webhooks/${id}/test`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};