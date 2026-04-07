import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

function getUserHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  return { "x-user": JSON.stringify(user) };
}

export const getVuelosHoy = async () => {
  const res = await axios.get(`${API_URL}/turno/vuelos-hoy`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const avanzarEstadoVuelo = async (id_vuelo, duracion_estimada_min = null) => {
  const res = await axios.post(
    `${API_URL}/turno/vuelos/${id_vuelo}/avanzar`,
    duracion_estimada_min != null ? { duracion_estimada_min } : {},
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getEstadoOperaciones = async () => {
  const res = await axios.get(`${API_URL}/turno/estado-operaciones`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const setEstadoOperaciones = async (estado_general, motivo_inactivo = null) => {
  const res = await axios.put(
    `${API_URL}/turno/estado-operaciones`,
    { estado_general, motivo_inactivo },
    { headers: getUserHeader() }
  );
  return res.data;
};
