import PartnersGrid from "@/components/PartnersGrid";
import Link from "next/link";

export const metadata = {
  title: "Publicaciones de referencia — Noir Atelier",
  description: "Sitios y revistas de moda que Noir Atelier sigue de cerca.",
};

export default function RevistasPage() {
  return (
    <main className="page-content">
      <section className="editoriales-hero">
        <h1>Publicaciones de referencia</h1>
        <p className="editoriales-intro">
          Sitios hermanos y revistas internacionales que forman parte
          del universo editorial de Noir Atelier.
        </p>
      </section>
      <section className="section-block">
        <PartnersGrid />
      </section>
    </main>
  );
}
