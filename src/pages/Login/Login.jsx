import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/loginApi";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await login(correo, password);

      const user = {
        ...data,
        expiresAt: Date.now() + 1000 * 60 * 30
      };

      localStorage.setItem("user", JSON.stringify(user));

      if (user.must_change_password) {
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
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}
