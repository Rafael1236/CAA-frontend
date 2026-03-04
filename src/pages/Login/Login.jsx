import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/loginApi";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await login(username, password);

      const user = {
        ...data,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };

      localStorage.setItem("user", JSON.stringify(user));

      if (user.must_change_password || user.must_set_email) {
        navigate("/perfil");
        return;
      }

      if (user.rol === "ALUMNO") navigate("/alumno/dashboard");
      else if (user.rol === "PROGRAMACION") navigate("/programacion/dashboard");
      else if (user.rol === "ADMIN") navigate("/admin/dashboard");
    } catch {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="login">
      <form onSubmit={handleSubmit} className="login__card">
        <h2>Iniciar sesión</h2>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}