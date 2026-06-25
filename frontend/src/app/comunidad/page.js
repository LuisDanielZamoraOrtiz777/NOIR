import SocialButtons from "@/components/SocialButtons";

export const metadata = {
  title: "Comunidad — Noir Atelier",
  description: "Conecta con creadores, asiste a eventos y forma parte de la comunidad de moda editorial.",
};

export default function ComunidadPage() {
  return (
    <main className="section-block page-content">
      <section className="community-hero" data-element="community-hero">
        <h1>Comunidad Noir Atelier</h1>
        <p className="community-intro">
          Conecta con lectores y creadores que comparten una visión de moda editorial.
          Un espacio para aprender, colaborar y crecer juntos.
        </p>
        <div className="community-stats">
          <div className="stat-item">
            <strong>1,200+</strong>
            <span>Miembros activos</span>
          </div>
          <div className="stat-item">
            <strong>45</strong>
            <span>Eventos realizados</span>
          </div>
          <div className="stat-item">
            <strong>30+</strong>
            <span>Creadores colaboradores</span>
          </div>
        </div>
      </section>

      <section className="community-mission" data-element="community-mission">
        <h2>Nuestra Misión</h2>
        <div className="mission-content">
          <p>
            Noir Atelier nació como un espacio editorial, pero queremos ir más allá. 
            Creemos en el poder de la comunidad para transformar la industria de la moda 
            desde la colaboración, el respeto y la creatividad sin límites.
          </p>
          <p>
            Aquí encontrarás talleres, charlas, encuentros y oportunidades para 
            conectar con profesionales y apasionados de la moda editorial.
          </p>
        </div>
      </section>

      <section className="community-members" data-element="community-members">
        <h2>Miembros Destacados</h2>
        <div className="members-grid">
          <div className="member-card">
            <div className="member-avatar">AV</div>
            <h4>Ana V.</h4>
            <p className="member-role">Directora de arte</p>
            <p className="member-bio">Especialista en dirección creativa para editoriales de moda.</p>
            <div className="member-social">
              <SocialButtons />
            </div>
          </div>
          <div className="member-card">
            <div className="member-avatar">MR</div>
            <h4>Marco R.</h4>
            <p className="member-role">Fotógrafo</p>
            <p className="member-bio">Captura la esencia de la moda contemporánea en cada toma.</p>
            <div className="member-social">
              <SocialButtons />
            </div>
          </div>
          <div className="member-card">
            <div className="member-avatar">LS</div>
            <h4>Laura S.</h4>
            <p className="member-role">Estilista</p>
            <p className="member-bio">Crea narrativas visuales a través del styling y la composición.</p>
            <div className="member-social">
              <SocialButtons />
            </div>
          </div>
        </div>
      </section>

      <section className="community-events" data-element="community-events">
        <h2>Próximos Eventos</h2>
        <div className="events-list">
          <div className="event-card">
            <div className="event-date">
              <span className="event-day">15</span>
              <span className="event-month">JUL</span>
            </div>
            <div className="event-info">
              <h3>Taller de Dirección de Arte</h3>
              <p className="event-location">📍 Madrid, España</p>
              <p>Aprende a conceptualizar editoriales de moda desde cero.</p>
              <a href="/contacto" className="button small-button">Inscribirse</a>
            </div>
          </div>
          <div className="event-card">
            <div className="event-date">
              <span className="event-day">22</span>
              <span className="event-month">JUL</span>
            </div>
            <div className="event-info">
              <h3>Charla: Moda y Sostenibilidad</h3>
              <p className="event-location">📍 Online · Zoom</p>
              <p>Expertos debaten sobre el futuro sostenible de la industria.</p>
              <a href="/contacto" className="button small-button">Reservar plaza</a>
            </div>
          </div>
          <div className="event-card">
            <div className="event-date">
              <span className="event-day">05</span>
              <span className="event-month">AGO</span>
            </div>
            <div className="event-info">
              <h3>Networking: Creadores 2026</h3>
              <p className="event-location">📍 Barcelona, España</p>
              <p>Conecta con 50+ creadores y profesionales de la moda.</p>
              <a href="/contacto" className="button small-button">Más información</a>
            </div>
          </div>
        </div>
      </section>

      <section className="community-testimonials" data-element="community-testimonials">
        <h2>Lo que dicen nuestros miembros</h2>
        <div className="testimonials-grid">
          <blockquote className="testimonial-card">
            <p>"Noir Atelier me ayudó a conectar con fotógrafos increíbles y desarrollar mi portafolio."</p>
            <footer>— Carolina M., Estilista</footer>
          </blockquote>
          <blockquote className="testimonial-card">
            <p>"Los talleres son transformadores. Aprendí técnicas que no enseñan en la universidad."</p>
            <footer>— Diego F., Diseñador</footer>
          </blockquote>
          <blockquote className="testimonial-card">
            <p>"Una comunidad auténtica, sin pretensiones, donde todos crecemos juntos."</p>
            <footer>— Valentina R., Fotógrafa</footer>
          </blockquote>
        </div>
      </section>

      <section className="community-join" data-element="community-join">
        <h2>Únete a la Comunidad</h2>
        <p>
          ¿Listo para formar parte? Suscríbete a nuestro newsletter y recibe 
          invitaciones a eventos, talleres exclusivos y contenido prioritario.
        </p>
        <div className="join-actions">
          <a href="/contacto" className="button">Suscribirme ahora</a>
          <SocialButtons />
        </div>
      </section>
    </main>
  );
}