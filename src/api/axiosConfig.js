import axios from "axios";

const getApiUrl = () => window.__APP_CONFIG__?.API_URL ?? "http://localhost:5000/api";

// ── Request interceptor: attach JWT to every request ─────────────────────────
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
axios.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
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
