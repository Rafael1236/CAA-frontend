import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

export const getVuelosHoy = async () => {
  const res = await axios.get(`${API_URL}/turno/vuelos-hoy`);
  return res.data;
};

export const getEstadoOperaciones = async () => {
  const res = await axios.get(`${API_URL}/turno/estado-operaciones`);
  return res.data;
};

export const setEstadoOperaciones = async (estado_general, motivo_inactivo = null, bloques = []) => {
  const res = await axios.put(`${API_URL}/turno/estado-operaciones`, { estado_general, motivo_inactivo, bloques });
  return res.data;
};

export const publicarTicker = async (mensaje) => {
  const res = await axios.post(`${API_URL}/turno/ticker`, { mensaje });
  return res.data;
};

export const limpiarTicker = async () => {
  const res = await axios.delete(`${API_URL}/turno/ticker`);
  return res.data;
};

export const limpiarUnicoTicker = async (id) => {
  const res = await axios.delete(`${API_URL}/turno/ticker/${id}`);
  return res.data;
};

export const getTicker = async () => {
  const res = await axios.get(`${API_URL}/turno/ticker`);
  return res.data;
};

export const agregarBloquesSuspension = async (bloques) => {
  const res = await axios.post(`${API_URL}/turno/agregar-bloques-suspension`, { bloques });
  return res.data;
};
