import Link from 'next/link'

export function Footer() {
  return (
    <footer className="footer wrap">
      <p className="caption">© Copyright by Gonzalex - {new Date().getFullYear()} |</p>
      <Link className="link caption" href="/mentions-legales" rel="nofollow">
        Mentions légales
      </Link>
    </footer>
  )
}
