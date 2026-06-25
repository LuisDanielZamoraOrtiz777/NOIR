import ContactForm from "@/components/ContactForm";
import SocialButtons from "@/components/SocialButtons";

export const metadata = {
  title: "Contacto — Noir Atelier",
  description: "Contacto y datos de Noir Atelier. Envíanos un mensaje o suscríbete a nuestras novedades.",
};

export default function ContactPage() {
  return (
    <main id="contact-page" className="contact-page" data-element="contact-page">
      <section className="contact-hero">
        <h1>Contacto</h1>
        <p>Escríbenos para consultas editoriales, prensa o colaboraciones.</p>
      </section>

      <section className="contact-grid" data-element="contact-grid">
        <div className="contact-info" data-element="contact-info">
          <h2>Datos de contacto</h2>
          <p><strong>Email:</strong> <a href="mailto:contacto@noiratelier.example">contacto@noiratelier.example</a></p>
          <p><strong>Teléfono:</strong> <a href="tel:+34123456789">+34 123 456 789</a></p>
          <p><strong>Dirección:</strong> Calle de la Moda, 10 — 28001, Madrid, España</p>
          <p><strong>Horario:</strong> Lun–Vie 10:00–18:00</p>

          <h3>Redes</h3>
          <SocialButtons />

          <h3>Ubicación</h3>
          <div className="map-embed" aria-hidden="true">
            <iframe
              title="Mapa Noir Atelier"
              src="https://www.google.com/maps?q=Madrid+Spain&output=embed"
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </div>

        <div className="contact-form-area" data-element="contact-form-area">
          <h2>Envíanos un mensaje</h2>
          <ContactForm />
        </div>
      </section>

      <section className="faq" data-element="contact-faq">
        <h3>Preguntas frecuentes</h3>
        <ul>
          <li>¿Cómo envío material para publicar? — Envía un correo con una muestra y enlace a tu portafolio.</li>
          <li>¿Aceptan colaboraciones? — Sí, revisamos propuestas por email.</li>
        </ul>
      </section>
    </main>
  );
}
