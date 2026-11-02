import "./globals.css";
import { LanguageProvider } from "../components/LanguageContext";
import { ProfileProvider } from "../components/ProfileContext";
import { SimulationProvider } from "../components/SimulationContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Fixture Mundial 2026",
  description:
    "Fixture interactivo del Mundial de Fútbol 2026 (Canadá · México · EE.UU.) con horarios en tu zona horaria.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>
          <ProfileProvider>
            <SimulationProvider>{children}</SimulationProvider>
          </ProfileProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
