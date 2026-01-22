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
        <section className="home__hero">
          <h1>Gestión de Horarios de Vuelo</h1>
          <p>
            Plataforma para alumnos, instructores y personal de programación
            de la escuela de aviación.
          </p>

          <Link to="/login" className="home__cta">
            Iniciar sesión
          </Link>
        </section>

        <section className="home__info">
          <div className="info-card">
            <h3>Alumnos</h3>
            <p>
              Solicita y visualiza tus horarios de vuelo de forma clara y ordenada.
            </p>
          </div>

          <div className="info-card">
            <h3>Programación</h3>
            <p>
              Ajusta horarios según disponibilidad de instructores y aeronaves.
            </p>
          </div>

          <div className="info-card">
            <h3>Administración</h3>
            <p>
              Publica y controla el horario final de vuelos.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
