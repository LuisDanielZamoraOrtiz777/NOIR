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

export const metadata = {
  title: "Noir Atelier | Alta costura editorial",
  description: "Blog editorial de moda, comunidad y contacto profesional.",
  openGraph: {
    title: "Noir Atelier | Alta costura editorial",
    description: "Blog editorial de moda, comunidad y contacto profesional.",
    url: "https://noiratelier.example",
    siteName: "Noir Atelier",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noir Atelier",
    description: "Blog editorial de moda, comunidad y contacto profesional.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('noir-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(!s&&d))document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
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
