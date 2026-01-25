// src/services/adminApi.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/admin";

function getUserHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  return { "x-user": JSON.stringify(user) };
}

export const getCalendarioAdmin = async (week = "next") => {
  const res = await axios.get(`${API_URL}/calendario`, {
    params: { week },
    headers: getUserHeader(),
  });
  return res.data;
};

export const guardarCambiosAdmin = async (moves) => {
  const res = await axios.put(
    `${API_URL}/guardar-cambios`,
    { moves },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const publicarSemana = async () => {
  const res = await axios.post(
    `${API_URL}/publicar-semana`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getAeronavesActivasAdmin = async () => {
  const res = await axios.get(`${API_URL}/aeronaves`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getBloquesHorario = async () => {
  const res = await axios.get(
    `${API_URL}/bloques-horario`,
    { headers: getUserHeader() }
  );
  return res.data;
};

