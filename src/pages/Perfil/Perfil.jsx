import { useEffect, useState } from "react";
import { getPerfil, cambiarPassword, cambiarCorreo, updatePerfilInfo, updatePerfilAlumno } from "../../services/usuarioApi";
import Header from "../../components/Header/Header";
import { useNavigate } from "react-router-dom";
import "./Perfil.css";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  const [username, setUsername] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const [correo, setCorreo] = useState("");
  const [correoMsg, setCorreoMsg] = useState("");

  // Datos específicos de alumno
  const [telefono, setTelefono]           = useState("");
  const [numeroLicencia, setNumeroLicencia] = useState("");
  const [certMedico, setCertMedico]       = useState("");
  const [alumnoMsg, setAlumnoMsg]         = useState("");

  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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
      setOriginalData(p);

      setUsername(p.username || "");
      setCorreo(p.correo || "");
      if (p.rol === "ALUMNO") {
        setTelefono(p.telefono || "");
        setNumeroLicencia(p.numero_licencia || "");
        setCertMedico(p.certificado_medico ? p.certificado_medico.slice(0, 10) : "");
      }
      return p;
    } catch (e) {
      console.error("Error al cargar perfil:", e);
    }
  };

  useEffect(() => {
    refreshPerfil();
  }, []);

  const handleGuardarDatosAlumno = async () => {
    try {
      setAlumnoMsg("");
      const r = await updatePerfilAlumno({
        telefono,
        numero_licencia: numeroLicencia,
        certificado_medico: certMedico || null,
      });
      setAlumnoMsg(r.message);
      await refreshPerfil();
    } catch (e) {
      setAlumnoMsg(e.response?.data?.message || "Error al actualizar");
    }
  };

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
      const r = await updatePerfilInfo(username);
      setInfoMsg(r.message);

      const p = await refreshPerfil();
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.username = p.username;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      setInfoMsg(e.response?.data?.message || "Error al actualizar");
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
        user.must_set_email = p.must_set_email;
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

  // Advertencia certificado médico (≤ 30 días)
  const diasCert = certMedico
    ? Math.ceil((new Date(certMedico) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const certPorVencer = diasCert !== null && diasCert <= 30;

  // Botones activos solo si hay cambios y son válidos
  const infoChanged = username !== originalData?.username && username.trim().length > 0;
  const correoChanged = (correo !== originalData?.correo || perfil?.must_set_email === true)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  const passReady = password.length > 0 && errors.length === 0;

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
                    value={perfil.nombre}
                    readOnly
                  />
                </div>
                <div className="perfil-field-group">
                  <label className="perfil-label">Apellido</label>
                  <input
                    className="perfil-input"
                    type="text"
                    value={perfil.apellido}
                    readOnly
                  />
                </div>
                <div className="perfil-field-group">
                  <label className="perfil-label">Nombre de usuario</label>
                  <input
                    className="perfil-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              <div className="perfil-actions" style={{ marginTop: "20px" }}>
                <button
                  className="btn-primary"
                  onClick={handleGuardarInfo}
                  disabled={!infoChanged}
                >
                  Actualizar nombre de usuario
                </button>
                {infoMsg && <span className={infoMsg.includes("✅") ? "msg" : "msg error"}>{infoMsg}</span>}
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
                <button
                  className="btn-secondary"
                  onClick={handleGuardarCorreo}
                  disabled={!correoChanged}
                >
                  Guardar correo
                </button>
                {correoMsg && <span className={correoMsg.includes("✅") ? "msg" : "msg error"}>{correoMsg}</span>}
              </div>
            </section>

            {perfil.rol === "ALUMNO" && (
              <section className="perfil-section full">
                <h3>Datos de vuelo</h3>

                {certPorVencer && (
                  <div className={`perfil-cert-warning ${diasCert < 0 ? "perfil-cert-warning--vencido" : ""}`}>
                    {diasCert < 0
                      ? `Tu certificado médico venció hace ${Math.abs(diasCert)} días.`
                      : `Tu certificado médico vence en ${diasCert} día${diasCert === 1 ? "" : "s"}.`}
                  </div>
                )}

                <div className="perfil-kv">
                  <div className="perfil-field-group">
                    <label className="perfil-label">Teléfono</label>
                    <input
                      className="perfil-input"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 7777-8888"
                    />
                  </div>
                  <div className="perfil-field-group">
                    <label className="perfil-label">N° de licencia</label>
                    <input
                      className="perfil-input"
                      type="text"
                      value={numeroLicencia}
                      onChange={(e) => setNumeroLicencia(e.target.value)}
                      placeholder="Ej. PPL-00123"
                    />
                  </div>
                  <div className="perfil-field-group">
                    <label className="perfil-label">Venc. certificado médico</label>
                    <input
                      className={`perfil-input ${certPorVencer ? "perfil-input--alerta" : ""}`}
                      type="date"
                      value={certMedico}
                      onChange={(e) => setCertMedico(e.target.value)}
                    />
                  </div>
                  <div className="perfil-field-group">
                    <label className="perfil-label">Soleado</label>
                    <div className={`perfil-soleado-badge ${perfil.soleado ? "perfil-soleado-badge--on" : "perfil-soleado-badge--off"}`}>
                      {perfil.soleado ? "Solo" : "Dual"}
                    </div>
                  </div>
                </div>

                <div className="perfil-actions" style={{ marginTop: "20px" }}>
                  <button className="btn-primary" onClick={handleGuardarDatosAlumno}>
                    Guardar datos de vuelo
                  </button>
                  {alumnoMsg && (
                    <span className={alumnoMsg.includes("✅") ? "msg" : "msg error"}>
                      {alumnoMsg}
                    </span>
                  )}
                </div>
              </section>
            )}

            <section className="perfil-section full">
              <h3>Seguridad</h3>

              {requiereCambioPass && (
                <p className="perfil-note">
                  Por seguridad, debes cambiar la contraseña inicial.
                </p>
              )}

              <div className="perfil-field-group">
                <label className="perfil-label">Nueva contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    className="perfil-input"
                    type={showPass ? "text" : "password"}
                    placeholder="Mín. 8 caracteres, 1 mayús, 1 num."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validarPassword(e.target.value);
                    }}
                  />
                  <button
                    className="password-toggle-btn"
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    title={showPass ? "Ocultar" : "Mostrar"}
                  >
                    {showPass ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
              </div>

              <ul className="password-rules">
                {password && (
                  <>
                    <li className={password.length >= 8 ? "ok" : ""}>Mínimo 8 caracteres</li>
                    <li className={/[A-Z]/.test(password) ? "ok" : ""}>Al menos una letra mayúscula</li>
                    <li className={/\d/.test(password) ? "ok" : ""}>Al menos un número</li>
                  </>
                )}
              </ul>

              <div className="perfil-actions">
                <button
                  className="btn-primary"
                  onClick={handleGuardarPassword}
                  disabled={!passReady}
                >
                  Cambiar contraseña
                </button>
                {passMsg && <span className={passMsg.includes("✅") ? "msg" : "msg error"}>{passMsg}</span>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}