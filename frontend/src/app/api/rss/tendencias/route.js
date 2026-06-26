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

// ─── Helper: extrae la primera URL de imagen de un item RSS ──────────────────
function extraerImagen(item) {
  // 1. media:content con url
  const mc = item["media:content"];
  if (mc) {
    const arr = Array.isArray(mc) ? mc : [mc];
    for (const m of arr) {
      const url = m?.$?.url || m?.url;
      if (url && /\.(jpg|jpeg|png|webp)/i.test(url)) return url;
    }
  }

  // 2. media:thumbnail
  const mt = item["media:thumbnail"];
  if (mt) {
    const url = mt?.$?.url || mt?.url;
    if (url) return url;
  }

  // 3. enclosure de tipo imagen
  const enc = item.enclosure;
  if (enc) {
    const type = enc?.$?.type || enc?.type || "";
    const url  = enc?.$?.url  || enc?.url  || "";
    if (type.startsWith("image") && url) return url;
  }

  // 4. og:image dentro de description / content:encoded
  const html =
    item["content:encoded"] ||
    item.description ||
    item.summary || "";
  const ogMatch = html.match(/<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i);
  if (ogMatch) return ogMatch[1];

  return null;
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
    
    // Buscar imagen
    const imgMatch = item.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                     item.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
                     item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    
    items.push({
      titulo: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "Sin título",
      resumen: descMatch ? limpiarHTML(descMatch[1]) : "",
      imagen: imgMatch ? imgMatch[1] : null,
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