/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️  NO hay rewrites hacia localhost.
  //     En Vercel, las rutas /api/* son servidas por las Route Handlers
  //     de Next.js que están en src/app/api/.
  //     En desarrollo local, idem — next dev sirve esas rutas directamente.

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.harpersbazaar.com" },
      { protocol: "https", hostname: "**.elle.com" },
      { protocol: "https", hostname: "**.highsnobiety.com" },
      { protocol: "https", hostname: "**.hearstapps.com" },
      { protocol: "https", hostname: "**.condenast.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "**.wordpress.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.imgix.net" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.pinimg.com" },
      { protocol: "https", hostname: "**.akamaized.net" },
    ],
    // Optimización de imágenes
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compresión
  compress: true,

  // SWC minifier (más rápido que Terser)
  swcMinify: true,

  // React strict mode para detectar problemas
  reactStrictMode: true,

  // Headers de cache para assets estáticos
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif|woff|woff2|css|js)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;