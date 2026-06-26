import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GuiltFree",
    short_name: "GuiltFree",
    description: "Mobilny dziennik kalorii, makroskładników i postępów.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#06140c",
    theme_color: "#10b981",
    orientation: "portrait",
    categories: ["health", "fitness", "food"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
