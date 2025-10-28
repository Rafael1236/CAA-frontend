import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Obtener todos los alumnos
export const getAlumnos = async () => {
  try {
    const response = await axios.get(`${API_URL}/alumnos`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los alumnos:", error);
    return [];
  }
};
