import { useEffect, useState } from "react";
import { getAlumnos } from "../../services/alumnosService";

function Dashboard() { 
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    getAlumnos().then((data) => setAlumnos(data));
  }, []);

  return (
    <div className="p-4">
      <h1>Listado de Alumnos</h1>

      {alumnos.length === 0 ? (
        <p>No hay datos disponibles</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              
              <th>Nombre Completo</th>
              <th>Nivel</th>
              <th>Tipo Licencia</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a) => (
              <tr key={a.id}>
                
                <td>{a.nombre_completo}</td>
                <td>{a.nivel}</td>
                <td>{a.tipo_licencia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard; 