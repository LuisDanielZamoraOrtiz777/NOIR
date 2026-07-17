import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./tendencias.css";
import "./editoriales.css";
import "./postcardextra.css";
import "./dark.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { ThemeProvider } from "@/context/ThemeContext";
import ChatWidget from "@/components/ChatWidget";

const BASE_URL = "https://noiratelier-two.vercel.app";

export const metadata = {
  title: {
    default: "Noir Atelier | Alta costura editorial",
    template: "%s | Noir Atelier",
  },
  description:
    "Noir Atelier es un blog editorial de moda, tendencias, pasarelas y cultura fashion. Descubre contenido exclusivo sobre alta costura, estilo y vanguardia.",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "moda",
    "alta costura",
    "editorial",
    "tendencias",
    "pasarela",
    "Noir Atelier",
    "fashion blog",
    "estilo",
    "vanguardia",
  ],
  openGraph: {
    title: "Noir Atelier | Alta costura editorial",
    description:
      "Blog editorial de moda, tendencias, pasarelas y cultura fashion. Descubre contenido exclusivo sobre alta costura.",
    url: BASE_URL,
    siteName: "Noir Atelier",
    type: "website",
    locale: "es_MX",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Noir Atelier - Alta costura editorial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noir Atelier | Alta costura editorial",
    description:
      "Blog editorial de moda, tendencias, pasarelas y cultura fashion.",
    images: [`${BASE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Noir Atelier",
    url: BASE_URL,
    description:
      "Blog editorial de moda, tendencias, pasarelas y cultura fashion.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/buscar?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('noir-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(!s&&d))document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="alternate" type="application/rss+xml" title="Noir Atelier RSS" href={`${BASE_URL}/api/rss/tendencias`} />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <ScrollReveal />
          <Footer />
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}