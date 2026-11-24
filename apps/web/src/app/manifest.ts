import type { MetadataRoute } from "next";
import { t } from "@/i18n/t";

/**
 * Web app manifest: lets people add the app to their home screen and open
 * it standalone, without browser chrome. iOS reads the `appleWebApp`
 * metadata in the root layout instead.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: t("app.name"),
    short_name: t("app.name"),
    description: t("app.tagline"),
    lang: "es-CL",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#e9ebe8",
    theme_color: "#e9ebe8",
    categories: ["social", "productivity"],
    // The app icon has transparent corners; the maskable one is full-bleed
    // ink with the symbol inside the safe zone.
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: t("pwa.shortcut.profile"), url: "/perfil" },
      { name: t("groups.create"), url: "/grupos/nuevo" },
    ],
  };
}
