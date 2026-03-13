import "./Home.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      const rol = user.rol.toUpperCase();
      if (rol === "ALUMNO") {
        navigate("/alumno/dashboard");
      }
    }
  }, [navigate]);

  return (
    <>
      <Header />

      <main className="home">

        {/* ── HERO ── */}
        <section className="home__hero">
          <div className="hero__grid" />
          <div className="hero__glow" />
          <div className="hero__ring hero__ring--1" />
          <div className="hero__ring hero__ring--2" />
          <div className="hero__ring hero__ring--3" />
          <div className="hero__line hero__line--1" />
          <div className="hero__line hero__line--2" />

          <div className="hero__content">
            <div className="hero__badge">
              <span className="hero__badge-dot" />
              Escuela de aviación · El Salvador
            </div>

            <p className="hero__eyebrow">Centro de Adiestramiento Aéreo Académico</p>

            <h1 className="hero__title">
              Formando los mejores
              <span className="hero__title-accent"> pilotos del país</span>
            </h1>

            <p className="hero__desc">
              Somos la familia de pilotos más grande de El Salvador. Con décadas
              de experiencia, instructores certificados y una flota moderna, te
              llevamos desde tierra hasta las nubes.
            </p>

            <div className="hero__actions">
              <Link to="/login" className="btn-primary">
                <span>✦</span> Iniciar sesión
              </Link>
              <a href="#nosotros" className="btn-outline">Conocer más</a>
            </div>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-num">✈</span>
              <span className="hero__stat-lbl">Aeropuerto Ilopango</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-num">DGAC</span>
              <span className="hero__stat-lbl">Certificada</span>
            </div>
            <div className="hero__stat">
              <span className="hero__stat-num">SV</span>
              <span className="hero__stat-lbl">El Salvador</span>
            </div>
          </div>
        </section>

        {/* ── NOSOTROS ── */}
        <section className="home__about" id="nosotros">
          <div className="about__inner">
            <div className="about__text">
              <p className="section__tag">Quiénes somos</p>
              <h2 className="section__title">
                Una escuela con historia en la aviación salvadoreña
              </h2>
              <p className="section__body">
                El Centro de Adiestramiento Aéreo Académico nació con la misión
                de formar pilotos de excelencia. Ubicados en el Aeropuerto de
                Ilopango, operamos en un entorno real de tráfico aéreo que
                prepara a nuestros alumnos para cualquier desafío en los cielos.
              </p>
              <p className="section__body">
                Nuestro equipo de instructores, todos con experiencia en aviación
                comercial y privada, acompaña a cada alumno desde su primer vuelo
                hasta la obtención de su licencia.
              </p>
              <button className="btn-outline">Conocer más sobre CAAA</button>
            </div>

            <div className="about__visual">
              <div className="vis__grid" />
              <span className="vis__corner vis__corner--tl" />
              <span className="vis__corner vis__corner--tr" />
              <span className="vis__corner vis__corner--bl" />
              <span className="vis__corner vis__corner--br" />
              <div className="vis__center">
                <span className="vis__plane">✈</span>
                <span className="vis__label">Hangar 38-B · Ilopango</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── PILLARS ── */}
        <section className="home__pillars">
          <div className="pillars__header">
            <p className="section__tag">Lo que nos define</p>
            <h2 className="section__title">Por qué elegirnos</h2>
            <p className="section__body">
              Excelencia, seguridad y compromiso con cada uno de nuestros alumnos.
            </p>
          </div>

          <div className="pillars__grid">
            <div className="pillar__card">
              <div className="pillar__icon">🎓</div>
              <h3>Instructores certificados</h3>
              <p>
                Nuestros instructores cuentan con experiencia real en aviación
                comercial y privada, certificados a nivel nacional e internacional.
              </p>
            </div>
            <div className="pillar__card">
              <div className="pillar__icon">✈</div>
              <h3>Flota moderna</h3>
              <p>
                Contamos con aeronaves en óptimas condiciones técnicas para
                garantizar la seguridad de cada vuelo de principio a fin.
              </p>
            </div>
            <div className="pillar__card">
              <div className="pillar__icon">📍</div>
              <h3>Ubicación estratégica</h3>
              <p>
                Operamos desde el Aeropuerto Internacional de Ilopango, con
                condiciones reales de tráfico aéreo desde el primer día.
              </p>
            </div>
          </div>
        </section>

        {/* ── LOCATION ── */}
        <section className="home__location">
          <div className="location__inner">
            <div className="location__text">
              <p className="section__tag">Dónde encontrarnos</p>
              <h2>Estamos en Ilopango,<br />San Salvador</h2>
              <p>
                Visitanos en nuestras instalaciones dentro del Aeropuerto de
                Ilopango. Nuestro equipo está disponible para atenderte y resolver
                todas tus dudas.
              </p>
            </div>
            <div className="location__details">
              <div className="loc__item">
                <span className="loc__icon">📍</span>
                <div>
                  <strong>Aeropuerto de Ilopango</strong>
                  <span>Hangar 38-B, San Salvador</span>
                </div>
              </div>
              <div className="loc__item">
                <span className="loc__icon">📞</span>
                <div>
                  <strong>+503 2295-0029</strong>
                  <span>+503 7890-3572</span>
                </div>
              </div>
              <div className="loc__item">
                <span className="loc__icon">🌐</span>
                <div>
                  <strong>caaasv.com</strong>
                  <span>@caaasv en Instagram</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="home__cta-section">
          <div className="cta__box">
            <div className="cta__glow" />
            <h2>¿Listo para volar?</h2>
            <p>Iniciá sesión en la plataforma de gestión de vuelos de CAAA.</p>
            <div className="cta__actions">
              <Link to="/login" className="btn-primary">
                <span>✦</span> Iniciar sesión
              </Link>
              <button className="btn-outline">Contactarnos</button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}