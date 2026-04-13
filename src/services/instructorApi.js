import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

function getUserHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  return { "x-user": JSON.stringify(user) };
}

export const getVuelosHoy = async () => {
  const res = await axios.get(`${API_URL}/instructor/vuelos-hoy`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getVuelosSemana = async () => {
  const res = await axios.get(`${API_URL}/instructor/vuelos-semana`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getMisAlumnos = async () => {
  const res = await axios.get(`${API_URL}/instructor/mis-alumnos`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const avanzarEstadoVuelo = async (id_vuelo, body = {}) => {
  const res = await axios.post(
    `${API_URL}/instructor/vuelos/${id_vuelo}/avanzar`,
    body,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const habilitarVueloExtra = async (id_alumno, id_semana, nuevo_limite) => {
  const res = await axios.patch(
    `${API_URL}/instructor/alumnos/${id_alumno}/habilitar-vuelo-extra`,
    { id_semana, nuevo_limite },
    { headers: getUserHeader() }
  );
  return res.data;
};
