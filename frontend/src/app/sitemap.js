const BASE_URL = "https://noiratelier-two.vercel.app";

export default async function sitemap() {
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/home`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/editoriales`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tendencias`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/revistas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/opinion`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/nosotros`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contacto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/acceso`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terminos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Intentar obtener editoriales dinámicas para el sitemap
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || BASE_URL}/api/editoriales/publicas`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      const editoriales = data.data || [];
      const editorialPages = editoriales.map((ed) => ({
        url: `${BASE_URL}/editoriales/${ed.id}`,
        lastModified: new Date(ed.fecha || ed.created_at),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
      return [...staticPages, ...editorialPages];
    }
  } catch (error) {
    console.error("Error fetching editoriales for sitemap:", error);
  }

  return staticPages;
}