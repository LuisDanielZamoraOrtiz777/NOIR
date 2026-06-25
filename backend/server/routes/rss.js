/**
 * rss.js — Consume feeds RSS de revistas de moda y extrae imagen, título, resumen y enlace.
 */

const express = require("express");
const https = require("https");
const http = require("http");
const { parseStringPromise } = require("xml2js");

const router = express.Router();

const RSS_FEEDS = [
  { fuente: "Harper's Bazaar", url: "https://www.harpersbazaar.com/rss/all.xml/", pais: "EE.UU." },
  { fuente: "Elle",            url: "https://www.elle.com/rss/all.xml/",           pais: "EE.UU." },
  { fuente: "Highsnobiety",    url: "https://www.highsnobiety.com/feed/",           pais: "Alemania" },
];

// ─── Helper: fetch con redirección ───────────────────────────────────────────
function fetchUrl(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("Demasiadas redirecciones"));
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, { headers: { "User-Agent": "NoirAtelierBot/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 220);
}

// ─── Helper: parsea feed XML ──────────────────────────────────────────────────
async function parseRSS(xml, fuente) {
  const parsed = await parseStringPromise(xml, { explicitArray: false });
  const items  = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
  const lista  = Array.isArray(items) ? items : [items];

  return lista.slice(0, 8).map((item, index) => ({
    id:      `${fuente.toLowerCase().replace(/\s/g, "-")}-${index}`,
    titulo:  item.title?.$?.text || item.title?._ || item.title || "Sin título",
    resumen: limpiarHTML(item.description || item.summary || item["media:description"] || ""),
    imagen:  extraerImagen(item),
    enlace:  item.link?.href || item.link || "#",
    fecha:   item.pubDate || item.published || item.updated || null,
    fuente,
  }));
}

// ─── Cache en memoria (5 min) ─────────────────────────────────────────────────
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── GET /api/rss/tendencias ──────────────────────────────────────────────────
router.get("/tendencias", async (_req, res) => {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return res.json({ status: "ok (cache)", articulos: cache, fuentes: RSS_FEEDS.map(f => f.fuente) });
  }

  const resultados = [];
  const errores    = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async ({ fuente, url, pais }) => {
      try {
        const xml      = await fetchUrl(url);
        const articulos = await parseRSS(xml, fuente);
        articulos.forEach((a) => resultados.push({ ...a, pais }));
      } catch (err) {
        errores.push({ fuente, error: err.message });
      }
    })
  );

  if (resultados.length === 0) {
    return res.status(502).json({ status: "error", mensaje: "No se pudieron obtener feeds.", errores });
  }

  resultados.sort((a, b) => {
    const da = a.fecha ? new Date(a.fecha) : 0;
    const db = b.fecha ? new Date(b.fecha) : 0;
    return db - da;
  });

  cache = resultados;
  cacheTimestamp = Date.now();

  res.json({
    status:   "ok",
    total:    resultados.length,
    fuentes:  RSS_FEEDS.map(f => f.fuente),
    errores:  errores.length ? errores : undefined,
    articulos: resultados,
  });
});

module.exports = router;
