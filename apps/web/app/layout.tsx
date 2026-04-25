import type { Metadata } from 'next'
import '../styles/main.scss'

export const metadata: Metadata = {
  title: 'Gonzalez Alexandre',
  description: 'Portfolio de Gonzalez Alexandre',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
