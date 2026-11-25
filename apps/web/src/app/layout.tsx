import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import localFont from "next/font/local";
import { ServiceWorker } from "@/components/service-worker";
import { t } from "@/i18n/t";
import "./globals.css";

// Figtree carries the interface; Bricolage Grotesque sets names and big
// numbers, where the woven world speaks loudest.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
// Knot Rope: the brand's twisted-rope display face, built from glyph sheets in
// Knot-Lana/. One drawn weight, declared as a range so the browser never fakes
// a bold. Large titles only: below ~24px its twist stripes turn to noise.
const rope = localFont({
  src: "../assets/fonts/KnotRope.woff2",
  variable: "--font-knot-rope",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute link-preview URLs point at the real site, not the request host.
  metadataBase: process.env.SITE_URL
    ? new URL(process.env.SITE_URL)
    : undefined,
  title: t("app.name"),
  description: t("app.tagline"),
  applicationName: t("app.name"),
  // iOS ignores the manifest: these tags make "Agregar a inicio" open the
  // app standalone with its own name and icon (`app/apple-icon.png`).
  appleWebApp: {
    capable: true,
    title: t("app.name"),
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#e9ebe8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${figtree.variable} ${bricolage.variable} ${rope.variable}`}
    >
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
