import DomLab from "@/components/DomLab";

export default function DomDemoPage() {
  return (
    <main id="dom-demo-page" className="dom-demo-page">
      <section className="section-block">
        <h1>Laboratorio DOM</h1>
        <p>
          Esta página demuestra cómo JavaScript puede manipular nodos del DOM dentro de un componente de React.
        </p>
        <DomLab />
      </section>
    </main>
  );
}
