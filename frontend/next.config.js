/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️  NO hay rewrites hacia localhost.
  //     En Vercel, las rutas /api/* son servidas por las Route Handlers
  //     de Next.js que están en src/app/api/.
  //     En desarrollo local, idem — next dev sirve esas rutas directamente.
  //
  //     Si en local quieres también levantar el servidor Express (backend/),
  //     hazlo en un puerto distinto y llámalo directamente desde donde lo
  //     necesites, SIN redirigir /api/* a él.

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
  },
};

module.exports = nextConfig;
