import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} Escuela de Aviación.  
        Todos los derechos reservados.
      </p>
    </footer>
  );
}
