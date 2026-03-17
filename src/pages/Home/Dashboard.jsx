import "./Home.css";
import HeaderPublico from "../../components/HeaderPublico/HeaderPublico";

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
      <HeaderPublico />


      <main className="home">

        <section className="home__hero">
          <div className="hero__image-bg" />
          <div className="hero__overlay" />

          <div className="hero__content">
            <div className="hero__badge">
              <span className="hero__badge-dot"></span>
              <span>Centro de Adiestramiento Aéreo</span>
            </div>

            <h1 className="hero__title">
              El arte de <br />
              <span className="hero__title-accent">conquistar el</span> <br />
              cielo.
            </h1>

            <p className="hero__desc">
              Formamos aviadores con excelencia técnica y humana,
              liderando la formación de pilotos profesionales en El Salvador
              desde hace más de 30 años.
            </p>

            <div className="hero__actions">
              <Link to="/login" className="btn-primary">
                PRÓXIMA PROMOCIÓN ✦
              </Link>
              <a href="#nosotros" className="btn-outline">VER NUESTRA FLOTA</a>

            </div>
          </div>
        </section>

        <section className="home__about" id="nosotros">
          <div className="about__inner">
            <div className="about__visual">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiYA5ory0FAfEaEOd19BPuoVCX4j9j61t4iQjaDccggjTOhdhPIXXk5kzNtXrpulDxLqWqB7XwkCYOr_0aW2-_a9ZBe-PT7UdOZKKkP92ILPpPPgoV1_vt2FJrGp8tA355pCUuCycptt8DOtcOhnUxgnYprM2wH3aH5xVv65CBnsutvws7PVVH2WSuEtYbnnzHx6NF1IZFQ_G9cc0CakUEVFQX66L0bJ35YHi-WZ1Rs_lu4t5EUoXDAx19IRMkVloA6Fh_5sGhl_Q"
                alt="Instructor de aviación"
                className="about__img-main"
              />
              <img
                src="https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1470&auto=format&fit=crop"
                alt="Hangar CAAA"
                className="about__img-sub"
              />
            </div>

            <div className="about__text">
              <div className="section__header">
                <p className="section__tag">Nuestra Misión ✦</p>
                <h2 className="section__title">
                  Más que una escuela, <br />
                  <span className="text-accent">un legado en el aire.</span>
                </h2>
              </div>
              <div className="section__body-wrap">
                <p className="section__body">
                  Fundada bajo la premisa de la excelencia, CAAA ha
                  formado a generaciones de pilotos profesionales que
                  hoy vuelan en las principales aerolíneas del mundo y
                  en la aviación corporativa.
                </p>
                <p className="section__body">
                  Creemos en un entrenamiento personalizado, donde cada
                  alumno recibe la atención necesaria para desarrollar las
                  habilidades críticas que un piloto profesional requiere
                  hoy en día.
                </p>
              </div>

              <div className="about__stats">
                <div className="stat__item">
                  <span className="stat__num">115</span>
                  <span className="stat__lbl">Pilotos Graduados</span>
                </div>
                <div className="stat__item">
                  <span className="stat__num">4,500+</span>
                  <span className="stat__lbl">Horas de Vuelo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home__pillars theme-light">
          <div className="pillars__inner">
            <div className="pillars__header">
              <div className="section__header">
                <p className="section__tag">Excelencia ✦</p>
                <h2 className="section__title">¿Por qué CAAA?</h2>
              </div>
              <p className="section__body">
                Nuestra política de enseñanza se basa en la disciplina,
                la seguridad y la pasión por el vuelo profesional.
              </p>
            </div>

            <div className="pillars__grid">
              <div className="pillar__card">
                <div className="pillar__icon">01</div>
                <h3>Cuerpo docente de Élite</h3>
                <p>
                  Instructores con miles de horas de vuelo and amplia experiencia
                  en aerolíneas comerciales de toda la región.
                </p>
              </div>
              <div className="pillar__card">
                <div className="pillar__icon">02</div>
                <h3>Flota de vanguardia</h3>
                <p>
                  Mantenemos nuestras aeronaves bajo los estándares más estrictos
                  de la DGAC, garantizando fiabilidad total.
                </p>
              </div>
              <div className="pillar__card">
                <div className="pillar__icon">03</div>
                <h3>Entorno Real</h3>
                <p>
                  Ubicados en el corazón del tráfico aéreo nacional, preparando
                  al alumno para escenarios operacionales reales.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="home__tools">
          <div className="tools__header">
            <p className="section__tag">Nuestra Flota</p>
            <h2>Herramientas de Precisión</h2>
          </div>

          <div className="tools__grid">
            <div className="tool__card">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUA3W6TIHTGy12Y0LTzFAAxn_pSz_FMqPCCNHi7kW7_tjJ4cTUh2ApiMkf6oSbYFCZkDEZQ6Z0fjPXu5URZNwxLTodLdpRBfdUrNsjKxNIwSqYFsZDlmHgd_zwHwu9c43uKTOfwDIJdzkLyC-Do4_yjvVrpQWQIZv8zc0KuIVfPbVWGHIveFwUX6r1tFUXwhP8gBBxWP_0WwelDZXLjFeIqfixiPqlbneMi1WOqJtqQSLCajq8A9OlPs_rfn-678xRJGeCLx5SQns"
                alt="Cessna 172 Skyhawk"
                className="tool__img"
              />
              <div className="tool__info">
                <h3>Cessna 172 Skyhawk</h3>
                <p>Estándar de entrenamiento mundial</p>
              </div>
            </div>
            <div className="tool__card">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCM1jL6xiGuyM7A64ndE6_YmPISDGOzuDP5quDr1XdxFwH4NreN046Tz3IgDr_NDKvCmzsipEeXt4aEU-_pIwcwBEOAtms_Irs_FSL7wT1dcuMorypguQ1E11xgHA9Q64CdDC5JdOLKHW-DSa3M0ZhpnxrBP3x_c6irLvjAS4dnE7ygXo9rAMlJFchmMx7Bwfjw4twjlRWGZTtWULlJ7LjkHj5a4yaRb8gcJKIMlIenDEplAECeULDj1-25Pnn3jv291Xo9YLMLggQ"
                alt="Piper Warrior III"
                className="tool__img"
              />
              <div className="tool__info">
                <h3>Piper Warrior III</h3>
                <p>Navegación avanzada y confort</p>
              </div>
            </div>
          </div>
        </section>

        <section className="home__location">
          <div className="location__inner">
            <div className="location__text">
              <p className="section__tag">Ubicación ✦</p>
              <h2 className="section__title">El centro de <br /><span className="text-accent">operaciones.</span></h2>
              <p className="section__body">
                Nuestras instalaciones principales se encuentran en el
                Aeropuerto Internacional de Ilopango, el hub más importante
                para la aviación general en El Salvador.
              </p>

              <div className="location__details">
                <div className="loc__item">
                  <strong>Hangar 38-B</strong>
                  <span>Aeropuerto de Ilopango, San Salvador</span>
                </div>
                <div className="loc__item">
                  <strong>Contacto directo</strong>
                  <span>+503 2295-0029</span>
                </div>
                <div className="loc__item">
                  <strong>Canales digitales</strong>
                  <a href="#" className="loc__link">info@caaa.com.sv</a>
                </div>
              </div>
            </div>

            <div className="location__visual">
              <div className="location__img-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1550982504-20490710609b?q=80&w=1470&auto=format&fit=crop"
                  alt="Hangar CAAA exterior"
                  className="location__img"
                />
                <div className="location__overlay"></div>
              </div>
              <div className="location__btn-wrap">
                <button className="btn-glass">VER EN MAPA ✦</button>
              </div>
            </div>
          </div>
        </section>

        <section className="home__cta-section">
          <div className="cta__overlay"></div>
          <div className="cta__content">
            <h2 className="section__title">¿Listo para tomar los mandos?</h2>
            <p className="section__body text-white">
              El camino hacia una carrera profesional en la aviación comienza hoy.
              Contacta a nuestro equipo de admisiones.
            </p>
            <div className="cta__actions">
              <Link to="/login" className="btn-primary">
                INICIAR TU TOUR ✦
              </Link>
              <button className="btn-outline">VER PLAN DE ESTUDIOS</button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}