'use client'

import { useEffect } from 'react'

export function LoaderController() {
  useEffect(() => {
    const loader = document.querySelector<HTMLElement>('.loader')
    const swiperContainer = document.querySelector<HTMLElement>('.swiper-container')

    if (!loader || !swiperContainer) return

    function preloadImages(selector: string): Promise<void> {
      return new Promise((resolve) => {
        const images = Array.from(document.querySelectorAll<HTMLImageElement>(`${selector} img`))
        if (images.length === 0) return resolve()
        let loaded = 0
        images.forEach((img) => {
          if (img.complete) {
            loaded++
            if (loaded === images.length) resolve()
          } else {
            img.addEventListener('load', () => {
              loaded++
              if (loaded === images.length) resolve()
            })
            img.addEventListener('error', () => {
              loaded++
              if (loaded === images.length) resolve()
            })
          }
        })
      })
    }

    preloadImages('.main-layout__main').then(() => {
      setTimeout(() => {
        if (swiperContainer) swiperContainer.style.opacity = '1'
        if (loader) loader.style.opacity = '0'
      }, 3000)
      setTimeout(() => {
        if (loader) loader.style.display = 'none'
      }, 4000)
    })
  }, [])

  return null
}
