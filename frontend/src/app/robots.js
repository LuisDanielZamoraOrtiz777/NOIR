const BASE_URL = "https://noiratelier-two.vercel.app";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/perfil/", "/acceso/", "/registro/", "/editor/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}