-- ============================================================
-- MIGRACIÓN: Tabla de editoriales
-- Ejecutar: psql -d tu_base_de_datos -f migration_editoriales.sql
-- ============================================================

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
);

CREATE INDEX IF NOT EXISTS idx_editoriales_publicado ON editoriales(publicado);
CREATE INDEX IF NOT EXISTS idx_editoriales_fecha     ON editoriales(fecha DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_editoriales_updated_at ON editoriales;
CREATE TRIGGER trg_editoriales_updated_at
  BEFORE UPDATE ON editoriales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SEED: editoriales reales ──────────────────────────────────────────────────
INSERT INTO editoriales (titulo, autor, fecha, categoria, resumen, contenido, publicado) VALUES
(
  'Siluetas en Negro Puro',
  'Ana García',
  '2026-05-10',
  'Pasarela',
  'Cortes depurados y texturas sobrias inspirados en Rick Owens y Ann Demeulemeester. Un viaje por la pasarela de París SS26.',
  'La temporada Primavera/Verano 2026 estuvo marcada por siluetas monocromáticas que desafiaron los convencionalismos. Rick Owens y Ann Demeulemeester apostaron por cortes geométricos depurados que redefinen la relación entre el cuerpo y la prenda.',
  TRUE
),
(
  'Blanco y Transparencia — Mugler SS26',
  'Sofía Mendoza',
  '2026-04-22',
  'Editorial',
  'Casey Cadwallader para Mugler equilibra cuerpo y geometría. Organzas transparentes y cortes asimétricos definen la nueva femineidad.',
  'Casey Cadwallader para Mugler propuso una colección que equilibra el cuerpo y la geometría. Las transparencias en organza y los cortes asimétricos dominaron la pasarela de París.',
  TRUE
),
(
  'Contraste Urbano — Bottega Veneta',
  'Luis Fernández',
  '2026-03-18',
  'Trend',
  'Matthieu Blazy redefine el lujo silencioso en Milán. El intreccio aparece en formatos nunca vistos.',
  'Matthieu Blazy en Bottega Veneta sorprendió con una colección que mezcla materiales inesperados con siluetas clásicas. El intreccio apareció en formatos nunca vistos sobre los que se proyecta una nueva idea del lujo.',
  TRUE
),
(
  'Quiet Luxury — The Row & Loro Piana',
  'Camila Torres',
  '2026-02-14',
  'Tendencia',
  'Sin logos, sin estridencias: solo corte, material y proporción. The Row y Loro Piana consolidan la estética dominante.',
  'The Row de Mary-Kate y Ashley Olsen junto a Loro Piana han definido el Quiet Luxury. Esta estética prioriza la calidad sobre la ostentación y se ha convertido en el lenguaje del lujo contemporáneo.',
  TRUE
),
(
  'Denim Couture — Sacai x Jean Paul Gaultier',
  'Ana García',
  '2026-01-02',
  'Colaboración',
  'La colaboración más esperada del año mezcla el deconstructivismo de Chitose Abe con el espíritu transgresor de Gaultier.',
  'Chitose Abe para Sacai y el legado de Jean Paul Gaultier se fusionan en una colección que deconstruye el denim y lo eleva a la categoría de couture.',
  FALSE
)
ON CONFLICT DO NOTHING;
