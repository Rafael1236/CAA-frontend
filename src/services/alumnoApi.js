import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

export const getMiHorario = async (week) => {
  if (!localStorage.getItem("token")) return [];
  const res = await axios.get(`${API_URL}/alumno/mi-horario`, { params: { week } });
  return res.data;
};

export const getMiLicencia = async () => {
  const res = await axios.get(`${API_URL}/alumno/licencia`);
  return res.data;
};

export const getMiInfo = async () => {
  const res = await axios.get(`${API_URL}/alumno/mi-info`);
  return res.data;
};

export const getMiProximoMantenimiento = async () => {
  const res = await axios.get(`${API_URL}/alumno/mi-proximo-mantenimiento`);
  return res.data;
};

export const cancelarVuelo = async (id_vuelo, { tipo_cancelacion, justificacion_cancelacion, archivo }) => {
  const formData = new FormData();
  formData.append("tipo_cancelacion", tipo_cancelacion);
  formData.append("justificacion_cancelacion", justificacion_cancelacion);
  if (archivo) formData.append("archivo", archivo);
  const res = await axios.patch(`${API_URL}/alumno/vuelos/${id_vuelo}/cancelar`, formData);
  return res.data;
};

export const getCondicionesCancelacion = async () => {
  const res = await axios.get(`${API_URL}/alumno/condiciones-cancelacion`);
  return res.data;
};

export const getBloquesBloqueadosAlumno = async () => {
  const res = await axios.get(`${API_URL}/alumno/bloques-bloqueados`);
  return res.data;
};

export const getPlanVuelo = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/plan-vuelo`);
  return res.data;
};

export const guardarPlanVuelo = async (id_vuelo, datos) => {
  const res = await axios.put(`${API_URL}/alumno/vuelos/${id_vuelo}/plan-vuelo`, datos);
  return res.data;
};

export const completarPlanVuelo = async (id_vuelo, pdfBlob) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, "plan-vuelo.pdf");
  const res = await axios.patch(`${API_URL}/alumno/vuelos/${id_vuelo}/plan-vuelo/completar`, formData);
  return res.data;
};

export const getWB = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/weight-balance`);
  return res.data;
};

export const guardarWB = async (id_vuelo, datos) => {
  const res = await axios.put(`${API_URL}/alumno/vuelos/${id_vuelo}/weight-balance`, datos);
  return res.data;
};

export const completarWB = async (id_vuelo) => {
  const res = await axios.patch(`${API_URL}/alumno/vuelos/${id_vuelo}/weight-balance/completar`, {});
  return res.data;
};

export const getLoadsheet = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/loadsheet`);
  return res.data;
};

export const guardarLoadsheet = async (id_vuelo, datos) => {
  const res = await axios.put(`${API_URL}/alumno/vuelos/${id_vuelo}/loadsheet`, datos);
  return res.data;
};

export const completarLoadsheet = async (id_vuelo, pdfBlob) => {
  const formData = new FormData();
  formData.append("pdf", pdfBlob, "loadsheet.pdf");
  const res = await axios.patch(`${API_URL}/alumno/vuelos/${id_vuelo}/loadsheet/completar`, formData);
  return res.data;
};

export const getReporteVuelo = async (id_vuelo) => {
  const res = await axios.get(`${API_URL}/alumno/vuelos/${id_vuelo}/reporte-vuelo`);
  return res.data;
};

export const guardarReporteVuelo = async (id_vuelo, datos) => {
  const res = await axios.put(`${API_URL}/alumno/vuelos/${id_vuelo}/reporte-vuelo`, datos);
  return res.data;
};

export const enviarReporteVuelo = async (id_vuelo, datos) => {
  const res = await axios.patch(`${API_URL}/alumno/vuelos/${id_vuelo}/reporte-vuelo/enviar`, datos);
  return res.data;
};

export const getReportesPendientesAlumno = async () => {
  const res = await axios.get(`${API_URL}/alumno/reportes-pendientes`);
  return res.data;
};

export const getReportesCompletadosAlumno = async () => {
  const res = await axios.get(`${API_URL}/alumno/reportes-completados`);
  return res.data;
};

export const firmarReporteVueloAlumno = async (id_vuelo, firma_alumno) => {
  const res = await axios.patch(
    `${API_URL}/alumno/vuelos/${id_vuelo}/reporte-vuelo/firmar`,
    { firma_alumno }
  );
  return res.data;
};
