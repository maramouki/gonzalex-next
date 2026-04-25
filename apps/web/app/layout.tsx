import type { Metadata } from 'next'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import '../styles/main.scss'

export const metadata: Metadata = {
  title: 'Gonzalez Alexandre',
  description: 'Portfolio de Gonzalez Alexandre',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
