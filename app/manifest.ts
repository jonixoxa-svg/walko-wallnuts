import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Lets the field team add the console to a phone home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.brand} — orchard`,
    short_name: site.brandShort,
    description: "Walnut tree ownership, orchard map and field console.",
    start_url: "/en",
    display: "standalone",
    background_color: "#fbf8f2",
    theme_color: "#1e3a2b",
    orientation: "portrait-primary",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
