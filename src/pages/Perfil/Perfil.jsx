import { useEffect, useState } from "react";
import { getPerfil, cambiarPassword, cambiarCorreo } from "../../services/usuarioApi";
import Header from "../../components/Header/Header";
import { useNavigate } from "react-router-dom";
import "./Perfil.css";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);

  const [correo, setCorreo] = useState("");
  const [correoMsg, setCorreoMsg] = useState("");

  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [passMsg, setPassMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const p = await getPerfil();
      setPerfil(p);
      setCorreo(p.correo || "");
    })();
  }, []);

  const validarPassword = (value) => {
    const errs = [];
    if (value.length < 8) errs.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(value)) errs.push("Al menos una letra mayúscula");
    if (!/\d/.test(value)) errs.push("Al menos un número");
    setErrors(errs);
  };

  const handleGuardarCorreo = async () => {
    try {
      setCorreoMsg("");
      const r = await cambiarCorreo(correo);
      setCorreoMsg(r.message || "Correo actualizado");
      const p = await getPerfil();
      setPerfil(p);

      const user = JSON.parse(localStorage.getItem("user"));
      user.correo = p.correo;
      localStorage.setItem("user", JSON.stringify(user));
    } catch (e) {
      setCorreoMsg(e.response?.data?.message || "Error al actualizar correo");
    }
  };

  const handleGuardarPassword = async () => {
    try {
      setPassMsg("");
      await cambiarPassword(password);

      const user = JSON.parse(localStorage.getItem("user"));
      user.must_change_password = false;
      localStorage.setItem("user", JSON.stringify(user));

      setPassword("");
      setErrors([]);
      setPassMsg("Contraseña actualizada ✅");

      if (perfil?.must_change_password) {
        if (user.rol === "ALUMNO") navigate("/alumno/dashboard");
        else if (user.rol === "PROGRAMACION") navigate("/programacion/dashboard");
        else navigate("/admin/dashboard");
      } else {
        const p = await getPerfil();
        setPerfil(p);
      }
    } catch (e) {
      setPassMsg(e.response?.data?.message || "Error al cambiar contraseña");
    }
  };

  if (!perfil) return <p className="perfil-loading">Cargando…</p>;

  const esPrimeraVez = perfil.must_change_password === true;

  return (
     <>
       <Header />
    <div className="perfil-container">
      <div className="perfil-card wide">
        <div className="perfil-header">
          <div>
            <h2>Mi perfil</h2>
            <p className="perfil-sub">
              Administra tus datos y tu seguridad.
            </p>
          </div>

          {esPrimeraVez && (
            <span className="perfil-badge">
              Requiere cambio de contraseña
            </span>
          )}
        </div>

        <div className="perfil-grid">
          <section className="perfil-section">
            <h3>Información</h3>
            <div className="perfil-kv">
              <div>
                <span className="k">Nombre</span>
                <span className="v">{perfil.nombre} {perfil.apellido}</span>
              </div>
              <div>
                <span className="k">Rol</span>
                <span className="v">{perfil.rol}</span>
              </div>
            </div>
          </section>

          <section className="perfil-section">
            <h3>Correo</h3>
            <label className="perfil-label">Correo actual</label>
            <input
              className="perfil-input"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <div className="perfil-actions">
              <button className="btn-secondary" onClick={handleGuardarCorreo}>
                Guardar correo
              </button>
              {correoMsg && <span className="msg">{correoMsg}</span>}
            </div>
          </section>

          <section className="perfil-section full">
            <h3>Seguridad</h3>
            <label className="perfil-label">Nueva contraseña</label>
            <input
              className="perfil-input"
              type="password"
              placeholder="Ej: Aviacion2026"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validarPassword(e.target.value);
              }}
            />

            <ul className="password-rules">
              {errors.length === 0 && password ? (
                <li className="ok">Contraseña válida ✅</li>
              ) : (
                errors.map((e, i) => <li key={i}>{e}</li>)
              )}
            </ul>

            <div className="perfil-actions">
              <button
                className="btn-primary"
                onClick={handleGuardarPassword}
                disabled={errors.length > 0 || !password}
              >
                Guardar contraseña
              </button>
              {passMsg && <span className="msg">{passMsg}</span>}
            </div>

            {esPrimeraVez && (
              <p className="perfil-note">
                Por seguridad, debes cambiar la contraseña para continuar usando el sistema.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>

    </>
  );
}
