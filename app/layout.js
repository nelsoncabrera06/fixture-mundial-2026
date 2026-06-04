import "./globals.css";

export const metadata = {
  title: "Fixture Mundial 2026",
  description:
    "Fixture interactivo del Mundial de Fútbol 2026 (Canadá · México · EE.UU.) con horarios en tu zona horaria.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
