import axios from "axios";

// ── Configuration Centralization ─────────────────────────────────────────────
const getRawBaseUrl = () => window.__APP_CONFIG__?.API_URL || "http://localhost:5000";

// URL base del servidor (sin /api)
export const BASE_URL = getRawBaseUrl().replace(/\/api$/, "");

// URL de la API (con /api)
export const API_URL = BASE_URL + "/api";

// URL para Sockets (misma que la base)
export const SOCKET_URL = BASE_URL;

// URL para Loadsheet (Plan de Vuelo)
export const LOADSHEET_URL = window.__APP_CONFIG__?.LOADSHEET_URL || import.meta.env.VITE_LOADSHEET_URL || "http://localhost:5174";

const getApiUrl = () => API_URL;

// ── Request interceptor: attach JWT to every request ─────────────────────────
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Si estamos en modo proyección con una llave en la URL, la enviamos en los headers
  const params = new URLSearchParams(window.location.search);
  const key = params.get("key");
  if (key) {
    config.headers["x-proyeccion-key"] = key;
  }

  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
axios.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      // Si el error es por conflicto de sesión (otro inicio de sesión), cerramos de inmediato
      if (err.response.data?.session_conflict) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login?reason=conflict";
        return Promise.reject(err);
      }

      err.config._retry = true;
      try {
        const { data } = await axios.post(
          `${getApiUrl()}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        localStorage.setItem("token", data.token);
        err.config.headers.Authorization = `Bearer ${data.token}`;
        return axios(err.config);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
