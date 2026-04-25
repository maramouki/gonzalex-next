'use client'

import { useEffect } from 'react'

export function LoaderController() {
  useEffect(() => {
    const loader = document.querySelector<HTMLElement>('.loader')
    if (!loader) return

    const hide = () => {
      loader.style.opacity = '0'
      setTimeout(() => { loader.style.display = 'none' }, 1000)
    }

    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>('.main-layout__main img')
    )

    if (images.length === 0) {
      setTimeout(hide, 2000)
      return
    }

    let done = 0
    const tick = () => {
      done++
      if (done === images.length) setTimeout(hide, 500)
    }

    images.forEach((img) => {
      if (img.complete) { tick(); return }
      img.addEventListener('load', tick, { once: true })
      img.addEventListener('error', tick, { once: true })
    })

    // Fallback: force hide after 6s no matter what
    const fallback = setTimeout(hide, 6000)
    return () => clearTimeout(fallback)
  }, [])

  return null
}
