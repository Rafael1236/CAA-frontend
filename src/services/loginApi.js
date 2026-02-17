import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const login = async (correo, password) => {
  const res = await axios.post(`${API_URL}/login`, {
    correo,
    password
  });
  return res.data;
};
