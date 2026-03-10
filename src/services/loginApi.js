import axios from "axios";

const API_URL = window.__APP_CONFIG__?.API_URL;

export const login = async (username, password) => {
  const res = await axios.post(`${API_URL}/auth/login`, {
    username,
    password
  });
  return res.data;
};
