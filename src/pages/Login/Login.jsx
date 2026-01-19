import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        correo,
        password,
      });

      localStorage.setItem("user", JSON.stringify(res.data));

      if (res.data.rol === "Alumno") {
        navigate("/alumno/dashboard");
      }
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
