import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AmigOrganizador",
  description:
    "De “juntémonos” a un plan en el calendario de todos, con un link.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
