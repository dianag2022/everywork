import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {

    "name": "GoeveryWork",
    "short_name": "GoeveryWork",
    "description": "Encuentra servicios profesionales en Cali, Colombia",
    "icons": [
      {
        "src": "/favicon.ico",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/favicon.ico",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "theme_color": "#2563eb",
    "background_color": "#ffffff",
    "display": "standalone"
  }
};