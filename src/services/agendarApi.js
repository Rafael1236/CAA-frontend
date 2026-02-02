import axios from "axios";

const API_URL = "http://localhost:5000/api";

function getUserHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  return {
    "x-user": JSON.stringify(user),
  };
}

export const getAeronavesPermitidas = async () => {
  const res = await axios.get(
    `${API_URL}/agendar/aeronaves-permitidas`,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getBloquesHorario = async () => {
  const res = await axios.get(
    `${API_URL}/agendar/bloques-horario`,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getBloquesOcupados = async (week = "next") => {
  const res = await axios.get(
    `${API_URL}/agendar/bloques-ocupados`,
    {
      params: { week },
      headers: getUserHeader(),
    }
  );
  return res.data;
};

export const getMisSolicitudes = async (week = "next") => {
  const res = await axios.get(
    `${API_URL}/agendar/mis-solicitudes`,
    {
      params: { week },
      headers: getUserHeader(),
    }
  );
  return res.data;
};

export const guardarSolicitud = async (vuelos) => {
  console.log("POST vuelos:", vuelos);

  const res = await axios.post(
    `${API_URL}/agendar/solicitar-vuelos`,
    { vuelos },
    {
      params: { week: "next" },
      headers: getUserHeader(),
    }
  );
  return res.data;
};
