import "./globals.css";
import { AuthProvider } from "../components/AuthContext";
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
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
