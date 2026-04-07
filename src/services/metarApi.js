import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

export const getMetar = async () => {
  const res = await axios.get(`${API_URL}/metar`);
  return res.data;
};
