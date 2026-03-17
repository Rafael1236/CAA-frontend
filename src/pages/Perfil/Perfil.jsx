import { useEffect, useState } from "react";
import { getPerfil, cambiarPassword, cambiarCorreo, updatePerfilInfo } from "../../services/usuarioApi";
import Header from "../../components/Header/Header";
import { useNavigate } from "react-router-dom";
import "./Perfil.css";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const [correo, setCorreo] = useState("");
  const [correoMsg, setCorreoMsg] = useState("");

  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);
  const [passMsg, setPassMsg] = useState("");

  const navigate = useNavigate();

  const goDashboard = (rol) => {
    if (rol === "ALUMNO") navigate("/alumno/dashboard");
    else if (rol === "PROGRAMACION") navigate("/programacion/dashboard");
    else navigate("/admin/dashboard");
  };

  const refreshPerfil = async () => {
    try {
      const p = await getPerfil();
      setPerfil(p);
      setNombre(p.nombre || "");
      setApellido(p.apellido || "");
      setCorreo(p.correo || "");
      return p;
    } catch (e) {
      console.error("Error al cargar perfil:", e);
    }
  };

  useEffect(() => {
    refreshPerfil();
  }, []);

  const validarPassword = (value) => {
    const errs = [];
    if (value.length < 8) errs.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(value)) errs.push("Al menos una letra mayúscula");
    if (!/\d/.test(value)) errs.push("Al menos un número");
    setErrors(errs);
  };

  const handleGuardarInfo = async () => {
    try {
      setInfoMsg("");
      const r = await updatePerfilInfo(nombre, apellido);
      setInfoMsg(r.message);
      
      const p = await refreshPerfil();
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.nombre = p.nombre;
        user.apellido = p.apellido;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      setInfoMsg(e.response?.data?.message || "Error al actualizar información");
    }
  };

  const handleGuardarCorreo = async () => {
    try {
      setCorreoMsg("");
      const r = await cambiarCorreo(correo);
      setCorreoMsg(r.message);

      const p = await refreshPerfil();

      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.correo = p.correo;
        user.must_set_email = p.must_set_email;
        localStorage.setItem("user", JSON.stringify(user));
      }

      const stillPending = p.must_change_password || p.must_set_email;
      if (!stillPending) {
        setTimeout(() => goDashboard(p.rol), 1500);
      }
    } catch (e) {
      setCorreoMsg(e.response?.data?.message || "Error al actualizar correo");
    }
  };

  const handleGuardarPassword = async () => {
    try {
      setPassMsg("");
      const r = await cambiarPassword(password);
      setPassMsg(r.message);

      const p = await refreshPerfil();

      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.must_change_password = p.must_change_password;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setPassword("");
      setErrors([]);

      const stillPending = p.must_change_password || p.must_set_email;
      if (!stillPending) {
        setTimeout(() => goDashboard(p.rol), 1500);
      }
    } catch (e) {
      setPassMsg(e.response?.data?.message || "Error al cambiar contraseña");
    }
  };

  if (!perfil) return <p className="perfil-loading">Cargando…</p>;

  const requiereCambioPass = perfil.must_change_password === true;
  const requiereCorreo = perfil.must_set_email === true || !perfil.correo;
  const requiereAlgo = requiereCambioPass || requiereCorreo;

  return (
    <>
      <Header />

      <div className="perfil-container">
        <div className="perfil-card wide">
          <div className="perfil-header">
            <div>
              <p className="perfil-sub">Gestión de cuenta</p>
              <h2>Mi perfil</h2>
              <p className="perfil-sub">Administra tus datos personales y seguridad.</p>
            </div>

            {requiereAlgo && (
              <span className="perfil-badge">
                Perfil incompleto
              </span>
            )}
          </div>

          <div className="perfil-grid">
            <section className="perfil-section">
              <h3>Información Personal</h3>
              <div className="perfil-kv">
                <div className="perfil-field-group">
                  <label className="perfil-label">Nombre</label>
                  <input
                    className="perfil-input"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="perfil-field-group">
                  <label className="perfil-label">Apellido</label>
                  <input
                    className="perfil-input"
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                  />
                </div>
                <div className="perfil-field-group">
                  <label className="perfil-label">Nombre de usuario</label>
                  <input
                    className="perfil-input"
                    type="text"
                    value={perfil.username}
                    disabled
                    style={{ background: "#f1f5f9", cursor: "not-allowed" }}
                  />
                </div>
              </div>
              <div className="perfil-actions" style={{ marginTop: "20px" }}>
                <button className="btn-primary" onClick={handleGuardarInfo}>
                  Actualizar información
                </button>
                {infoMsg && <span className="msg">{infoMsg}</span>}
              </div>
            </section>

            <section className="perfil-section">
              <h3>Contacto</h3>

              {requiereCorreo && (
                <p className="perfil-note">
                  Debes registrar un correo válido para continuar.
                </p>
              )}

              <div className="perfil-field-group">
                <label className="perfil-label">Correo electrónico</label>
                <input
                  className="perfil-input"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div className="perfil-actions" style={{ marginTop: "20px" }}>
                <button className="btn-secondary" onClick={handleGuardarCorreo}>
                  Guardar correo
                </button>
                {correoMsg && <span className="msg">{correoMsg}</span>}
              </div>
            </section>

            <section className="perfil-section full">
              <h3>Seguridad</h3>

              {requiereCambioPass && (
                <p className="perfil-note">
                  Por seguridad, debes cambiar la contraseña inicial.
                </p>
              )}

              <div className="perfil-field-group">
                <label className="perfil-label">Nueva contraseña</label>
                <input
                  className="perfil-input"
                  type="password"
                  placeholder="Mín. 8 caracteres, 1 mayús, 1 num."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validarPassword(e.target.value);
                  }}
                />
              </div>

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
                  Cambiar contraseña
                </button>
                {passMsg && <span className="msg">{passMsg}</span>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}