import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

function getUserHeader() {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? { "x-user": JSON.stringify(user) } : {};
}

export const getMiHorario = async (week) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return [];
  }

  const res = await axios.get(`${API_URL}/alumno/mi-horario`, {
    params: { week },
    headers: getUserHeader(),
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

export const getMiInfo = async () => {
  const res = await axios.get(`${API_URL}/alumno/mi-info`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getMiProximoMantenimiento = async () => {
  const res = await axios.get(`${API_URL}/alumno/mi-proximo-mantenimiento`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const cancelarVuelo = async (id_vuelo, { tipo_cancelacion, justificacion_cancelacion, archivo }) => {
  const formData = new FormData();
  formData.append("tipo_cancelacion", tipo_cancelacion);
  formData.append("justificacion_cancelacion", justificacion_cancelacion);
  if (archivo) formData.append("archivo", archivo);

  const res = await axios.patch(
    `${API_URL}/alumno/vuelos/${id_vuelo}/cancelar`,
    formData,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getCondicionesCancelacion = async () => {
  const res = await axios.get(`${API_URL}/alumno/condiciones-cancelacion`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getBloquesBloqueadosAlumno = async () => {
  const res = await axios.get(`${API_URL}/alumno/bloques-bloqueados`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const getPlanVuelo = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/plan-vuelo`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const guardarPlanVuelo = async (id_vuelo, datos) => {
  const res = await axios.put(
    `${API_URL}/alumno/vuelos/${id_vuelo}/plan-vuelo`,
    datos,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const completarPlanVuelo = async (id_vuelo, pdfBlob) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, "plan-vuelo.pdf");
  const res = await axios.patch(
    `${API_URL}/alumno/vuelos/${id_vuelo}/plan-vuelo/completar`,
    formData,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getWB = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/weight-balance`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const guardarWB = async (id_vuelo, datos) => {
  const res = await axios.put(
    `${API_URL}/alumno/vuelos/${id_vuelo}/weight-balance`,
    datos,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const completarWB = async (id_vuelo) => {
  const res = await axios.patch(
    `${API_URL}/alumno/vuelos/${id_vuelo}/weight-balance/completar`,
    {},
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getLoadsheet = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/loadsheet`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const guardarLoadsheet = async (id_vuelo, datos) => {
  const res = await axios.put(
    `${API_URL}/alumno/vuelos/${id_vuelo}/loadsheet`,
    datos,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const completarLoadsheet = async (id_vuelo, pdfBlob) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, "loadsheet.pdf");
  const res = await axios.patch(
    `${API_URL}/alumno/vuelos/${id_vuelo}/loadsheet/completar`,
    formData,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const getReporteVuelo = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/reporte-vuelo`, {
    headers: getUserHeader(),
  });
  return res.data;
};

export const guardarReporteVuelo = async (id_vuelo, datos) => {
  const res = await axios.put(
    `${API_URL}/alumno/vuelos/${id_vuelo}/reporte-vuelo`,
    datos,
    { headers: getUserHeader() }
  );
  return res.data;
};

export const enviarReporteVuelo = async (id_vuelo, datos) => {
  const res = await axios.patch(
    `${API_URL}/alumno/vuelos/${id_vuelo}/reporte-vuelo/enviar`,
    datos,
    { headers: getUserHeader() }
  );
  return res.data;
};