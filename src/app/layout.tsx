import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Registros Dentales",
  description: "Seguimiento clinico de pacientes, tratamientos y citas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
