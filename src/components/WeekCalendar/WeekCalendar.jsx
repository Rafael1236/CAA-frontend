import "./WeekCalendar.css";

export default function WeekCalendar() {
  const today = new Date();

  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);

  const days = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <div className="week">
      {days.map((day) => (
        <div key={day} className="day">
          <h4>
            {day.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </h4>
          <p>Sin vuelos</p>
        </div>
      ))}
    </div>
  );
}
