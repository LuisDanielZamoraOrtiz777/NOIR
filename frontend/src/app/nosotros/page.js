import Link from "next/link";

export const metadata = {
  title: "Nosotros — Noir Atelier",
  description:
    "Conoce a Noir Atelier: editorial de moda, tendencias y colaboraciones creativas con visión internacional.",
};

export default function NosotrosPage() {
  return (
    <main className="section-block page-content" data-element="nosotros-page">
      <section className="section-header">
        <h1>Nosotros</h1>
        <p>
          Noir Atelier es una editorial de moda que combina contenido de alto nivel,
          análisis de tendencias y colaboraciones creativas para marcas, diseñadores
          y profesionales del estilo.
        </p>
      </section>

      <section className="section-block" data-element="nosotros-mision">
        <h2>Nuestra misión</h2>
        <p>
          Inspirar a audiencias exigentes con piezas editoriales que exploran la moda
          desde la estética, la cultura y la innovación. Buscamos generar relatos visuales
          que trasciendan temporadas.
        </p>
      </section>

      <section className="section-block" data-element="nosotros-valores">
        <h2>Lo que hacemos</h2>
        <div className="feature-grid">
          <article>
            <h3>Contenido editorial</h3>
            <p>
              Curamos textos y reportajes sobre desfiles, tendencias y colecciones
              internacionales con una mirada sofisticada y contemporánea.
            </p>
          </article>
          <article>
            <h3>Consultoría de estilo</h3>
            <p>
              Ofrecemos asesoría creativa para campañas, marcas emergentes y proyectos
              que necesitan posicionarse con identidad y coherencia visual.
            </p>
          </article>
          <article>
            <h3>Colaboraciones premium</h3>
            <p>
              Trabajamos con equipos de moda, prensa y diseño para lanzar propuestas
              editorialmente relevantes y con alcance internacional.
            </p>
          </article>
        </div>
      </section>

      <section className="section-block" data-element="nosotros-contacto">
        <h2>Hablemos</h2>
        <p>
          Si quieres colaborar, enviar material o solicitar una propuesta creativa,
          ponte en contacto con nosotros.
        </p>
        <Link href="/contacto" className="button cta-button">
          Contacto editorial
        </Link>
      </section>
    </main>
  );
}
