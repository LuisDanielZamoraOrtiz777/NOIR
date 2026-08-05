"use client";
import Link from "next/link";
import SocialButtons from "@/components/SocialButtons";

export default function FooterLayout() {
  return (
    <footer id="site-footer" className="site-footer" data-element="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <p>Noir Atelier — Alta costura editorial.</p>
          <p className="footer-copy">
            Creamos experiencias editoriales que conectan arte y moda con un enfoque profesional.
          </p>
        </div>

        <div className="footer-nav">
          <h3>Enlaces</h3>
          <ul>
            <li><Link href="/editoriales">Editoriales</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3>Contacto</h3>
          <p><a href="mailto:contacto@noiratelier.example">contacto@noiratelier.example</a></p>
          <p><a href="tel:+34123456789">+34 123 456 789</a></p>
        </div>

        <div className="footer-newsletter">
          <h3>Newsletter</h3>
          <p>Regístrate para recibir lanzamientos, colecciones exclusivas y eventos.</p>
          <form className="newsletter-form">
            <label htmlFor="newsletter-email">Correo</label>
            <input id="newsletter-email" type="email" placeholder="tu@correo.com" />
            <button type="submit" className="button">Suscribir</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
        </div>
        <p>© 2026 Noir Atelier. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
