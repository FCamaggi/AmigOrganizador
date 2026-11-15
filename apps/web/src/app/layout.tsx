import type { Metadata, Viewport } from "next";
import { Roboto_Condensed } from "next/font/google";
import { t } from "@/i18n/t";
import "./globals.css";

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-roboto-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute link-preview URLs point at the real site, not the request host.
  metadataBase: process.env.SITE_URL
    ? new URL(process.env.SITE_URL)
    : undefined,
  title: t("app.name"),
  description: t("app.tagline"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CL" className={robotoCondensed.variable}>
      <body>{children}</body>
    </html>
  );
}
