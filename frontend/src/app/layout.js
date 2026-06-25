import "./globals.css";
import "./tendencias.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = {
  title: "Noir Atelier | Alta costura editorial",
  description: "Blog editorial de moda y contacto profesional.",
  openGraph: {
    title: "Noir Atelier | Alta costura editorial",
    description: "Blog editorial de moda y contacto profesional.",
    url: "https://noiratelier.example",
    siteName: "Noir Atelier",
    type: "website",
    images: [
      {
        url: "/images/og-card.png",
        width: 1200,
        height: 630,
        alt: "Noir Atelier"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Noir Atelier",
    description: "Blog editorial de moda y contacto profesional.",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <ScrollReveal />
        <Footer />
      </body>
    </html>
  );
}
