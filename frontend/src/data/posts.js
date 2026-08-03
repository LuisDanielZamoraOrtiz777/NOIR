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
    imagen_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800",
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
    imagen_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800",
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
    imagen_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800",
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
    imagen_url: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=800",
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
    imagen_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=800",
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

  // ── COMENTARIOS ────────────────────────────────────────────────────────────
  {
    id: "comment-1",
    category: "Comentario",
    autor: "Juan Pérez",
    fecha: "15 de marzo, 2026",
    texto: "Este editorial es simplemente impresionante. La combinación de texturas y colores es armoniosa y sofisticada.",
    respuestas: [
      {
        id: "reply-1",
        autor: "Ana García",
        fecha: "16 de marzo, 2026",
        texto: "¡Gracias por tu comentario! Me alegra que te haya gustado.",
      },
    ],
    reactions: {
      likes: 12,
      loves: 8,
      wow: 3,
      sad: 0,
      angry: 0,
    },
  },

  // ── TENDENCIAS ─────────────────────────────────────────────────────────────
  {
    id: "trend-1",
    category: "Tendencia",
    titulo: "Minimalismo Radical",
    title: "Minimalismo Radical",
    autor: "Luis Fernández",
    fecha: "10 de febrero, 2026",
    desc: "Una estética basada en la simplicidad, la funcionalidad y la elegancia sin esfuerzo.",
    tags: ["Minimalismo", "Funcionalidad", "Elegancia"],
  },

  // ── COLABORACIONES ─────────────────────────────────────────────────────────
  {
    id: "collab-1",
    category: "Colaboración",
    titulo: "Nike x Off-White",
    title: "Nike x Off-White",
    autor: "Pedro López",
    fecha: "5 de marzo, 2026",
    desc: "La colaboración entre Nike y Off-White ha sido una de las más esperadas del año.",
    tags: ["Nike", "Off-White", "Colaboración"],
  },

  // ── EVENTOS ─────────────────────────────────────────────────────────────
  {
    id: "event-1",
    category: "Evento",
    titulo: "París Fashion Week",
    title: "París Fashion Week",
    autor: "Carlos Ruiz",
    fecha: "15 de septiembre, 2026",
    desc: "La París Fashion Week es uno de los eventos más importantes de la moda global.",
    tags: ["Paris", "Fashion Week", "Moda"],
  },

];

export default posts;