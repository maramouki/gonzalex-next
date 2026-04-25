import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="wrap" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      <h1>404</h1>
      <p>Cette page n'existe pas.</p>
      <Link href="/">← Retour à l'accueil</Link>
    </main>
  )
}
