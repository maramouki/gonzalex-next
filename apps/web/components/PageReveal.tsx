'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function PageReveal() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [out, setOut] = useState(false)

  useEffect(() => {
    setVisible(true)
    setOut(false)
    const t1 = setTimeout(() => setOut(true), 50)
    const t2 = setTimeout(() => setVisible(false), 900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pathname])

  if (!visible) return null

  return <div className={`page-reveal${out ? ' page-reveal--out' : ''}`} />
}
