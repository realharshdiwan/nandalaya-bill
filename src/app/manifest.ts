import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nandalaya",
    short_name: "Nandalaya",
    description: "School uniform & garment business management",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#00592B",
    theme_color: "#00592B",
    orientation: "any",
    categories: ["business"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
