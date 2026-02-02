import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const getMiHorario = async (week) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return [];
  }

  const res = await axios.get(`${API_URL}/alumno/mi-horario`, {
    params: { week },
    headers: {
      "x-user": JSON.stringify(user),
    },
  });

  return res.data;
};

export const getMiLicencia = async () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const res = await axios.get(`${API_URL}/alumno/licencia`, {
    headers: {
      "x-user": JSON.stringify(user),
    },
  });

  return res.data;
};

export const cancelarVuelo = async (id_vuelo) => {
  const res = await axios.patch(
    `${API_URL}/alumno/vuelos/${id_vuelo}/cancelar`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};
