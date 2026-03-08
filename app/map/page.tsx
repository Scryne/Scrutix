import type { Metadata } from 'next'
import MapPage from './_components/MapPage'

export const metadata: Metadata = {
  title: 'Secim Haritasi | Scrutix',
  description: 'Turkiye secim sonuclari haritasi. 81 ilin secim sonuclarini interaktif harita uzerinde inceleyin.',
}

export default function MapPageRoute() {
  return <MapPage />
}
