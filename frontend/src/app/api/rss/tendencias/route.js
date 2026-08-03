import { query } from "@/lib/db";

const RSS_FEEDS = [
  { fuente: "Harper's Bazaar", url: "https://www.harpersbazaar.com/rss/all.xml/", pais: "EE.UU." },
  { fuente: "Elle",            url: "https://www.elle.com/rss/all.xml/",           pais: "EE.UU." },
  { fuente: "Highsnobiety",    url: "https://www.highsnobiety.com/feed/",           pais: "Alemania" },
];

// ─── Helper: fetch con redirección ───────────────────────────────────────────
async function fetchUrl(url, redirects = 0) {
  if (redirects > 5) throw new Error("Demasiadas redirecciones");

  const response = await fetch(url, {
    headers: { "User-Agent": "NoirAtelierBot/1.0" },
    redirect: "manual",
  });

  if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
    return fetchUrl(response.headers.get("location"), redirects + 1);
  }
  if (response.status !== 200) throw new Error(`HTTP ${response.status}`);

  return response.text();
}

// ─── Helper: limpia HTML de texto plano ──────────────────────────────────────
function limpiarHTML(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 220);
}

// ─── Helper: parsea feed XML ──────────────────────────────────────────────────
async function parseRSS(xml, fuente) {
  // Parseo simple sin xml2js para evitar dependencia adicional
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;

  let match;
  const isAtom = xml.includes("<feed>");
  const regex = isAtom ? entryRegex : itemRegex;

  while ((match = regex.exec(xml)) !== null && items.length < 8) {
    const item = match[1];

    const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i) ||
                      item.match(/<link[^>]+href="([^"]+)"/i);
    const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
                      item.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const dateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
                      item.match(/<published[^>]*>([\s\S]*?)<\/published>/i);

    // Buscar imagen: revisa varias fuentes posibles, en orden de fiabilidad
    const contentMatch = item.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
    const enclosureMatch =
      item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image[^"']*["']/i) ||
      item.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]*url=["']([^"']+)["']/i);
    const imgEnContenido = contentMatch ? contentMatch[1].match(/<img[^>]+src=["']([^"']+)["']/i) : null;
    const imgEnDescripcion = descMatch ? descMatch[1].match(/<img[^>]+src=["']([^"']+)["']/i) : null;

    const imgMatch =
      item.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
      item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
      enclosureMatch ||
      imgEnContenido ||
      imgEnDescripcion ||
      item.match(/<img[^>]+src=["']([^"']+)["']/i);

    const imagenUrl = imgMatch ? imgMatch[1] : null;

    // Clave: si no hay imagen real, NO se agrega el artículo — nunca debe
    // mostrarse una tarjeta sin foto en el sitio.
    if (!imagenUrl) continue;

    items.push({
      titulo: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Sin título",
      resumen: descMatch ? limpiarHTML(descMatch[1]) : "",
      imagen: imagenUrl,
      enlace: linkMatch ? linkMatch[1].replace(/<[^>]+>/g, "").trim() : "#",
      fecha: dateMatch ? dateMatch[1].trim() : null,
      fuente,
    });
  }

  return items;
}

// ─── Cache en memoria (5 min) ─────────────────────────────────────────────────
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── GET /api/rss/tendencias ──────────────────────────────────────────────────
export async function GET() {
  // Si hay cache vigente, devolverla
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return Response.json({
      status: "ok (cache)",
      articulos: cache,
      fuentes: RSS_FEEDS.map(f => f.fuente),
    });
  }

  const resultados = [];
  const errores    = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async ({ fuente, url, pais }) => {
      try {
        const xml = await fetchUrl(url);
        const articulos = await parseRSS(xml, fuente);
        articulos.forEach((a) => resultados.push({ ...a, pais }));
      } catch (err) {
        errores.push({ fuente, error: err.message });
      }
    })
  );

  if (resultados.length === 0) {
    return Response.json(
      { status: "error", mensaje: "No se pudieron obtener feeds.", errores },
      { status: 502 }
    );
  }

  // Ordenar por fecha (más reciente primero)
  resultados.sort((a, b) => {
    const da = a.fecha ? new Date(a.fecha) : 0;
    const db = b.fecha ? new Date(b.fecha) : 0;
    return db - da;
  });

  // Guardar en cache
  cache = resultados;
  cacheTimestamp = Date.now();

  return Response.json({
    status:   "ok",
    total:    resultados.length,
    fuentes:  RSS_FEEDS.map(f => f.fuente),
    errores:  errores.length ? errores : undefined,
    articulos: resultados,
  });
}
