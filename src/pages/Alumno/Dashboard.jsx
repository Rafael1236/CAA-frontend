import Header from "../../components/Header/Header";
import WeekCalendar from "../../components/WeekCalendar/WeekCalendar";


export default function DashboardAlumno() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <>
      <Header />

      <div style={{ padding: "40px" }}>
        <h1>Bienvenido, {user.nombre}</h1>
        <p>Este es tu panel de alumno.</p>

        <button disabled>
          Solicitar horario (próximamente)
        </button>
      </div>
      <WeekCalendar />
    </>
  );
}
