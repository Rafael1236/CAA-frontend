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

export const getAlumnosConLimite = async () => {
  const res = await axios.get(`${API_URL}/admin/alumnos-limite`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const habilitarVueloExtra = async (id_alumno, id_semana, nuevo_limite) => {
  const res = await axios.patch(
    `${API_URL}/admin/alumnos/${id_alumno}/habilitar-vuelo-extra`,
    { id_semana, nuevo_limite },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getInstructoresActivos = async () => {
  const res = await axios.get(`${API_URL}/admin/instructores-activos`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const cambiarInstructorVuelo = async (id_vuelo, id_instructor_nuevo) => {
  const res = await axios.patch(
    `${API_URL}/admin/vuelos/${id_vuelo}/cambiar-instructor`,
    { id_instructor_nuevo },
    { headers: getUserHeader() }
  );
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

export const getAuditoria = async (params = {}) => {
  const res = await axios.get(`${API_URL}/admin/auditoria`, {
    params,
    headers: getUserHeader(),
  });
  return res.data;
};

export const getAccionesAuditoria = async () => {
  const res = await axios.get(`${API_URL}/admin/auditoria/acciones`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getAlumnosListAdmin = async () => {
  const res = await axios.get(`${API_URL}/admin/alumnos`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getAlumnoPerfilAdmin = async (id_alumno) => {
  const res = await axios.get(`${API_URL}/admin/alumnos/${id_alumno}/perfil`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const setSoleado = async (id_alumno, soleado) => {
  const res = await axios.patch(
    `${API_URL}/admin/alumnos/${id_alumno}/soleado`,
    { soleado },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getMantenimientoAeronaves = async () => {
  const res = await axios.get(`${API_URL}/admin/mantenimiento`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const completarMantenimiento = async (id_mantenimiento) => {
  const res = await axios.patch(
    `${API_URL}/admin/mantenimiento/${id_mantenimiento}/completar`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};

export const registrarHorasManuales = async (id_aeronave, horas, descripcion = "") => {
  const res = await axios.post(
    `${API_URL}/admin/mantenimiento/horas-manuales`,
    { id_aeronave, horas, descripcion },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const cambiarEstadoAeronave = async (id, estado) => {
  const res = await axios.put(
    `${API_URL}/admin/aeronaves/${id}/estado`,
    { estado },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getAlertasMantenimiento = async () => {
  const res = await axios.get(`${API_URL}/admin/aeronaves/alertas-mantenimiento`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getVuelosFuturosAeronave = async (id) => {
  const res = await axios.get(`${API_URL}/admin/aeronaves/${id}/vuelos-futuros-count`, {
    headers: getUserHeader(),
  });
  return res.data;
};