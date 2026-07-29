// posts.js — Contenido editorial real de Noir Atelier
// Los editoriales hacen referencia a colecciones y diseñadores reales.

const posts = [
  // ── EDITORIALES ──────────────────────────────────────────────────────────────
  {
    id: "editorial-1",
    category: "Editorial",
    titulo: "Siluetas en Negro Puro",
    title: "Siluetas en Negro Puro",
    autor: "Ana García",
    fecha: "10 de mayo, 2026",
    categoria: "Pasarela",
    summary:
      "Cortes depurados y texturas sobrias inspirados en Rick Owens y Ann Demeulemeester. Un viaje por la pasarela de París SS26.",
    tags: ["Rick Owens", "Ann Demeulemeester", "París", "SS26"],
  },
  {
    id: "editorial-2",
    category: "Editorial",
    title: "Blanco y Transparencia — Mugler SS26",
    titulo: "Blanco y Transparencia — Mugler SS26",
    autor: "Sofía Mendoza",
    fecha: "22 de abril, 2026",
    categoria: "Editorial",
    summary:
      "Casey Cadwallader para Mugler equilibra cuerpo y geometría. Organzas transparentes y cortes asimétricos definen la nueva femineidad.",
    tags: ["Mugler", "Casey Cadwallader", "Transparencias", "París"],
  },
  {
    id: "editorial-3",
    category: "Editorial",
    title: "Contraste Urbano — Bottega Veneta",
    titulo: "Contraste Urbano — Bottega Veneta",
    autor: "Luis Fernández",
    fecha: "18 de marzo, 2026",
    categoria: "Trend",
    summary:
      "Matthieu Blazy redefine el lujo silencioso en Milán. El intreccio aparece en formatos nunca vistos sobre siluetas perfectamente calibradas.",
    tags: ["Bottega Veneta", "Matthieu Blazy", "Milán", "Lujo silencioso"],
  },
  {
    id: "editorial-4",
    category: "Editorial",
    title: "Quiet Luxury — The Row & Loro Piana",
    titulo: "Quiet Luxury — The Row & Loro Piana",
    autor: "Camila Torres",
    fecha: "14 de febrero, 2026",
    categoria: "Tendencia",
    summary:
      "Sin logos, sin estridencias: solo corte, material y proporción. The Row y Loro Piana consolidan la estética que domina el momento.",
    tags: ["The Row", "Loro Piana", "Quiet Luxury", "Minimalismo"],
  },
  {
    id: "editorial-5",
    category: "Editorial",
    title: "Denim Couture — Sacai x Jean Paul Gaultier",
    titulo: "Denim Couture — Sacai x Jean Paul Gaultier",
    autor: "Ana García",
    fecha: "2 de enero, 2026",
    categoria: "Colaboración",
    summary:
      "La colaboración más esperada del año mezcla el deconstructivismo de Chitose Abe con el espíritu transgresor de Gaultier.",
    tags: ["Sacai", "Jean Paul Gaultier", "Denim", "Colaboración"],
  },

  // ── LOOKS ─────────────────────────────────────────────────────────────────────
  {
    id: "look-1",
    category: "Look",
    titulo: "Estructura fluida",
    title: "Fluid Structure",
    autor: "Luis Fernández",
    fecha: "5 de marzo, 2026",
    imagen_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c784?auto=format&fit=crop&q=80&w=800",
    summary: "Outfit de noche con capas texturizadas y líneas depuradas inspiradas en Issey Miyake.",
    tags: ["Issey Miyake", "ropa de noche", "texturas", "capas"],
  },
  {
    id: "look-2",
    category: "Look",
    titulo: "Sastrería reinventada",
    title: "Reinvented Tailoring",
    autor: "Ana García",
    fecha: "12 de febrero, 2026",
    imagen_url: "https://images.unsplash.com/photo-1581009148876-80de0666e676?auto=format&fit=crop&q=80&w=800",
    summary: "Prendas de corte masculino con delicadeza femenina y acentos metálicos al estilo de Phoebe Philo.",
    tags: ["Phoebe Philo", "sastrería", "moda femenina", "accesorios metálicos"],
  },
  {
    id: "look-3",
    category: "Look",
    titulo: "Negro absoluto",
    title: "Absolute Black",
    autor: "Sofía Mendoza",
    fecha: "19 de enero, 2026",
    imagen_url: "https://images.unsplash.com/photo-1491553895911-0055eca6420d?auto=format&fit=crop&q=80&w=800",
    summary: "Una composición monocromática que explora fuerza y sutileza. Referencias: Yohji Yamamoto.",
    tags: ["Yohji Yamamoto", "monocromático", "negro", "minimalismo"],
  },
];

export default posts;
