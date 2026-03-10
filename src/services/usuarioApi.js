import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function getUserHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  return { "x-user": JSON.stringify(user) };
}

export const getPerfil = async () => {
  const res = await axios.get(`${API_URL}/usuario/perfil`, {
    headers: getUserHeader()
  });
  return res.data;
};

export const cambiarPassword = async (nuevaPassword) => {
  const res = await axios.put(
    `${API_URL}/usuario/cambiar-password`,
    { nuevaPassword },
    { headers: getUserHeader() }
  );
  return res.data;
};

export const cambiarCorreo = async (nuevoCorreo) => {
  const res = await axios.put(
    `${API_URL}/usuario/cambiar-correo`,
    { nuevoCorreo },
    { headers: getUserHeader() }
  );
  return res.data;
};
