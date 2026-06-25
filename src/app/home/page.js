import Image from "next/image";
import Link from "next/link";
import EventBanner from "@/components/EventBanner";
import InteractiveMenu from "@/components/InteractiveMenu";
import PostCard from "@/components/PostCard";
import SearchBox from "@/components/SearchBox";
import SocialButtons from "@/components/SocialButtons";
import posts from "@/data/posts";

export default function HomePage() {
  return (
    <main id="main-content" data-element="hero">
      <EventBanner />
      <InteractiveMenu />
      <section id="hero-section" className="hero-section" data-element="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Alta costura editorial</p>
          <h1 id="home-title">Noir Atelier</h1>
          <p className="hero-text">
            Un espacio donde el minimalismo, la moda vanguardista y la narración visual se encuentran.
          </p>
          <div className="hero-buttons">
            <Link href="/editoriales" className="button cta-button" id="cta-principal" data-element="cta-principal">
              Explorar editoriales
            </Link>
            <Link href="/contacto" className="button" id="cta-contacto" data-element="cta-contacto">
              Contactar
            </Link>
          </div>
        </div>
        <div className="hero-image-container">
          <Image
            src="/images/hero_fashion.png"
            alt="Noir Atelier Alta Costura"
            width={1200}
            height={900}
            className="hero-img"
            priority
          />
        </div>
      </section>

      <section id="editoriales-section" className="section-block" data-element="editoriales-recentes">
        <h2>Editoriales recientes</h2>
        <div className="card-grid">
          {posts.slice(0, 3).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section id="looks-section" className="section-block">
        <div className="section-header">
          <h2>Looks destacados</h2>
          <SearchBox />
        </div>
        <div className="card-grid">
          {posts.slice(3, 6).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section id="community-section" className="section-block" data-element="community-section">
        <div className="community-copy">
          <h2>Comunidad Noir Atelier</h2>
          <p>
            Descubre tendencias, debates y conexiones con creadores que piensan en clave editorial.
          </p>
          <Link href="/comunidad" className="button secondary-button">
            Ir a comunidad
          </Link>
        </div>
        <SocialButtons />
      </section>
    </main>
  );
}
