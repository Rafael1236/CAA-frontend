import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

export const getPerfil = async () => {
  const res = await axios.get(`${API_URL}/usuario/perfil`);
  return res.data;
};

export const cambiarPassword = async (nuevaPassword) => {
  const res = await axios.put(`${API_URL}/usuario/cambiar-password`, { nuevaPassword });
  return res.data;
};

export const cambiarCorreo = async (nuevoCorreo) => {
  const res = await axios.put(`${API_URL}/usuario/cambiar-correo`, { nuevoCorreo });
  return res.data;
};

export const updatePerfilInfo = async (username) => {
  const res = await axios.put(`${API_URL}/usuario/update-info`, { username });
  return res.data;
};

export const updatePerfilAlumno = async ({ telefono, numero_licencia, certificado_medico }) => {
  const res = await axios.put(`${API_URL}/usuario/update-perfil-alumno`, { telefono, numero_licencia, certificado_medico });
  return res.data;
};
