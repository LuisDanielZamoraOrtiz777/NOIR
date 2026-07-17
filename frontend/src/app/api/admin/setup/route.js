import { neon } from "@neondatabase/serverless";
import { authenticateJWT } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/admin/setup
 * Crea la tabla `editoriales` si no existe y añade las editoriales seed.
 * Protegida con JWT de admin.
 */
export async function GET(request) {
  const auth = authenticateJWT(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL no definida." }, { status: 500 });
  }

  const sql = neon(process.env.DATABASE_URL);
  const log = [];

  try {
    // 1. Crear tabla
    await sql`
      CREATE TABLE IF NOT EXISTS editoriales (
        id          SERIAL PRIMARY KEY,
        titulo      TEXT NOT NULL,
        autor       TEXT NOT NULL DEFAULT 'Equipo Editorial Noir',
        fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
        categoria   TEXT NOT NULL DEFAULT 'Editorial',
        resumen     TEXT NOT NULL,
        contenido   TEXT NOT NULL DEFAULT '',
        publicado   BOOLEAN NOT NULL DEFAULT FALSE,
        imagen_url  TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    log.push("✅ Tabla 'editoriales' creada o ya existía.");

    // Crear tabla sitios_partners
    await sql`
      CREATE TABLE IF NOT EXISTS sitios_partners (
        id          SERIAL PRIMARY KEY,
        nombre      TEXT NOT NULL,
        url_api     TEXT NOT NULL UNIQUE,
        activo      BOOLEAN NOT NULL DEFAULT TRUE,
        creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    log.push("✅ Tabla 'sitios_partners' creada o ya existía.");

    // 2. Índices
    await sql`CREATE INDEX IF NOT EXISTS idx_editoriales_publicado ON editoriales(publicado)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_editoriales_fecha ON editoriales(fecha DESC)`;
    log.push("✅ Índices creados.");

    // 3. Verificar si ya hay datos
    const count = await sql`SELECT COUNT(*) as total FROM editoriales`;
    const total = Number(count[0].total);

    if (total === 0) {
      // 4. Seed con editoriales reales
      await sql`
        INSERT INTO editoriales (titulo, autor, fecha, categoria, resumen, contenido, publicado, imagen_url) VALUES
        (
          'Siluetas en Negro Puro',
          'Ana García',
          '2026-05-10',
          'Pasarela',
          'Cortes depurados y texturas sobrias inspirados en Rick Owens y Ann Demeulemeester. Un viaje por la pasarela de París SS26.',
          'La temporada Primavera/Verano 2026 estuvo marcada por siluetas monocromáticas que desafiaron los convencionalismos. Rick Owens y Ann Demeulemeester apostaron por cortes geométricos depurados.',
          true,
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80'
        ),
        (
          'Blanco y Transparencia — Mugler SS26',
          'Sofía Mendoza',
          '2026-04-22',
          'Editorial',
          'Casey Cadwallader para Mugler equilibra cuerpo y geometría. Organzas transparentes y cortes asimétricos definen la nueva femineidad.',
          'Casey Cadwallader para Mugler propuso una colección que equilibra el cuerpo y la geometría. Las transparencias en organza y los cortes asimétricos dominaron la pasarela de París.',
          true,
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80'
        ),
        (
          'Contraste Urbano — Bottega Veneta',
          'Luis Fernández',
          '2026-03-18',
          'Trend',
          'Matthieu Blazy redefine el lujo silencioso en Milán. El intreccio aparece en formatos nunca vistos.',
          'Matthieu Blazy en Bottega Veneta sorprendió con una colección que mezcla materiales inesperados con siluetas clásicas.',
          true,
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80'
        ),
        (
          'Quiet Luxury — The Row & Loro Piana',
          'Camila Torres',
          '2026-02-14',
          'Tendencia',
          'Sin logos, sin estridencias: solo corte, material y proporción. The Row y Loro Piana consolidan la estética dominante.',
          'The Row de Mary-Kate y Ashley Olsen junto a Loro Piana han definido el Quiet Luxury. Esta estética prioriza la calidad sobre la ostentación.',
          true,
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80'
        ),
        (
          'Denim Couture — Sacai x Jean Paul Gaultier',
          'Ana García',
          '2026-01-02',
          'Colaboración',
          'La colaboración más esperada del año mezcla el deconstructivismo de Chitose Abe con el espíritu transgresor de Gaultier.',
          'Chitose Abe para Sacai y el legado de Jean Paul Gaultier se fusionan en una colección que deconstruye el denim.',
          false,
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80'
        )
      `;
      log.push("✅ 5 editoriales seed insertadas.");
    } else {
      log.push(`ℹ️ La tabla ya tiene ${total} editorial(es). No se insertó seed.`);
    }

    // 5. Resumen
    const final = await sql`SELECT COUNT(*) as total FROM editoriales`;
    log.push(`📊 Total editoriales en BD: ${final[0].total}`);

    return NextResponse.json({ status: "ok", log });
  } catch (err) {
    console.error("[/api/admin/setup]", err.message);
    return NextResponse.json({ status: "error", error: err.message, log }, { status: 500 });
  }
}
