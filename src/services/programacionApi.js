import axios from "axios";

const API_URL = "http://localhost:5000/api";

function getUserHeader() {
  const raw = localStorage.getItem("user");
  if (!raw) return {};
  const user = JSON.parse(raw);
  return { "x-user": JSON.stringify(user) };
}

export const getBloquesHorario = async () => {
  const res = await axios.get(
    `${API_URL}/agendar/bloques-horario`,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getAeronavesActivas = async () => {
  const res = await axios.get(`${API_URL}/programacion/aeronaves`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getCalendarioProgramacion = async (week = "next") => {
  const res = await axios.get(`${API_URL}/programacion/calendario`, {
    params: { week },
    headers: getUserHeader(),
  });
  return res.data;
};

export const pasarSolicitudEnRevision = async (id_solicitud) => {
  const res = await axios.post(
    `${API_URL}/programacion/solicitudes/${id_solicitud}/en-revision`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};

export const guardarCambiosProgramacion = async (movimientos) => {
  const res = await axios.post(
    `${API_URL}/programacion/guardar-cambios`,
    { movimientos },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getBloquesBloqueados = async () => {
  const res = await axios.get(`${API_URL}/programacion/bloques-bloqueados`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const cancelarVueloProgramacion = async (id_vuelo) => {
  const res = await axios.patch(
    `${API_URL}/programacion/vuelos/${id_vuelo}/cancelar`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};