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

  const goDashboard = (rol) => {
    if (rol === "ALUMNO") navigate("/alumno/dashboard");
    else if (rol === "PROGRAMACION") navigate("/programacion/dashboard");
    else navigate("/admin/dashboard");
  };

  const refreshPerfil = async () => {
    const p = await getPerfil();
    setPerfil(p);
    setCorreo(p.correo || "");
    return p;
  };

  useEffect(() => {
    (async () => {
      await refreshPerfil();
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

      const p = await refreshPerfil();

      // ✅ actualizar localStorage: correo + flag must_set_email
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.correo = p.correo;
        user.must_set_email = p.must_set_email; // debería quedar false
        localStorage.setItem("user", JSON.stringify(user));
      }

      // ✅ si ya no falta nada, mandar al dashboard
      const stillPending = p.must_change_password || p.must_set_email;
      if (!stillPending) {
        goDashboard(p.rol);
      }
    } catch (e) {
      setCorreoMsg(e.response?.data?.message || "Error al actualizar correo");
    }
  };

  const handleGuardarPassword = async () => {
    try {
      setPassMsg("");
      await cambiarPassword(password);

      // ✅ refrescar perfil real (para saber si aún falta correo)
      const p = await refreshPerfil();

      // ✅ actualizar localStorage: flag must_change_password
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.must_change_password = p.must_change_password; // debería quedar false
        user.must_set_email = p.must_set_email;
        user.correo = p.correo;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setPassword("");
      setErrors([]);
      setPassMsg("Contraseña actualizada ✅");

      // ✅ si ya no falta nada, mandar al dashboard
      const stillPending = p.must_change_password || p.must_set_email;
      if (!stillPending) {
        goDashboard(p.rol);
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
              <h2>Mi perfil</h2>
              <p className="perfil-sub">Administra tus datos y tu seguridad.</p>
            </div>

            {requiereAlgo && (
              <span className="perfil-badge">
                Requiere completar perfil
              </span>
            )}
          </div>

          <div className="perfil-grid">
            <section className="perfil-section">
              <h3>Información</h3>
              <div className="perfil-kv">
                <div>
                  <span className="k">Nombre</span>
                  <span className="v">
                    {perfil.nombre} {perfil.apellido}
                  </span>
                </div>
                <div>
                  <span className="k">Rol</span>
                  <span className="v">{perfil.rol}</span>
                </div>
                <div>
                  <span className="k">Usuario</span>
                  <span className="v">{perfil.username}</span>
                </div>
              </div>
            </section>

            <section className="perfil-section">
              <h3>Correo</h3>

              {requiereCorreo && (
                <p className="perfil-note">
                  Debes registrar un correo válido para continuar.
                </p>
              )}

              <label className="perfil-label">Correo</label>
              <input
                className="perfil-input"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@correo.com"
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

              {requiereCambioPass && (
                <p className="perfil-note">
                  Por seguridad, debes cambiar la contraseña para continuar usando el sistema.
                </p>
              )}

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
            </section>
          </div>
        </div>
      </div>
    </>
  );
}