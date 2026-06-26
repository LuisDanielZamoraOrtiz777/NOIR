/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rewrite: /api/* → backend en puerto 4000
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },

  // Dominios permitidos para <img> externas (imágenes de RSS y CDNs de moda)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.harpersbazaar.com" },
      { protocol: "https", hostname: "**.elle.com" },
      { protocol: "https", hostname: "**.highsnobiety.com" },
      { protocol: "https", hostname: "**.hearstapps.com" },
      { protocol: "https", hostname: "**.media-amazon.com" },
      { protocol: "https", hostname: "**.condé.net" },
      { protocol: "https", hostname: "**.condenast.com" },
      { protocol: "https", hostname: "**.wp.com" },
      { protocol: "https", hostname: "**.wordpress.com" },
      { protocol: "https", hostname: "**.squarespace-cdn.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.pinimg.com" },
      { protocol: "https", hostname: "**.akamaized.net" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.imgix.net" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
