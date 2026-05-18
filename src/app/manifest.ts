import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QIVO - Connect with Heart',
    short_name: 'QIVO',
    description: 'A premium social platform for meaningful connections.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00A2FF',
    icons: [
      {
        src: 'https://picsum.photos/seed/qivo-icon-192/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/qivo-icon-512/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
