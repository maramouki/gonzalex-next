'use client'

import { useEffect, useRef } from 'react'
import Swiper from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import Link from 'next/link'
import { urlFor } from '@/lib/urlFor'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

type Category = { name: string; slug: string } | string

type Post = {
  _id: string
  title: string
  slug: { current: string }
  thumbnail: SanityImageSource | null
  bgImage: SanityImageSource | null
  categories: Category[]
  date: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function formatCategories(categories: Category[]): string {
  return categories?.map((c) => (typeof c === 'string' ? c : c.name)).join(', ') ?? ''
}

export function HomeSlider({ posts }: { posts: Post[] }) {
  const swiperRef = useRef<Swiper | null>(null)
  const prevRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !prevRef.current || !nextRef.current) return

    const controller = new AbortController()
    const { signal } = controller

    swiperRef.current = new Swiper(containerRef.current, {
      modules: [Navigation, Pagination],
      direction: 'vertical',
      centeredSlides: true,
      slidesPerView: 1.5,
      speed: 2000,
      spaceBetween: 40,
      pagination: {
        el: '.swiper-pagination',
        dynamicBullets: true,
      },
      navigation: {
        nextEl: nextRef.current,
        prevEl: prevRef.current,
      },
      breakpoints: {
        1025: {
          direction: 'horizontal' as const,
          slidesPerView: 1.5,
          centeredSlides: true,
          spaceBetween: 0,
          allowTouchMove: false,
        },
      },
      on: {
        afterInit(swiper) {
          const slides = swiper.slides

          const bgImages = Array.from(
            document.querySelectorAll<HTMLImageElement>('.bg-container > img')
          )

          const showBG = (id: number) =>
            bgImages[id]?.style.setProperty('animation', 'fadeIn 0.5s ease-out forwards')
          const hideBG = (id: number) =>
            bgImages[id]?.style.setProperty('animation', 'fadeOut 0.3s ease-out forwards')

          slides.forEach((slide, index) => {
            const image = slide.querySelector('img')
            if (!image) return
            image.setAttribute('data-swiper-index', String(index))
            image.addEventListener('mouseover', () => {
              if (index === swiper.activeIndex) showBG(index)
            }, { signal })
            image.addEventListener('mouseout', () => {
              if (index === swiper.activeIndex) hideBG(index)
            }, { signal })
          })

          if (window.innerWidth >= 1025) {
            nextRef.current?.addEventListener('mouseover', () =>
              containerRef.current?.classList.add('next-is-hover')
            , { signal })
            nextRef.current?.addEventListener('mouseout', () =>
              containerRef.current?.classList.remove('next-is-hover')
            , { signal })
            prevRef.current?.addEventListener('mouseover', () =>
              containerRef.current?.classList.add('prev-is-hover')
            , { signal })
            prevRef.current?.addEventListener('mouseout', () =>
              containerRef.current?.classList.remove('prev-is-hover')
            , { signal })
          }
        },
      },
    })

    return () => {
      controller.abort()
      swiperRef.current?.destroy(true, true)
    }
  }, [])

  return (
    <>
      {/* Background images */}
      <div className="bg-container">
        {posts.map((post) => (
          <img
            key={post._id}
            data-post-id={post._id}
            src={post.bgImage ? urlFor(post.bgImage).url() : ''}
            alt=""
          />
        ))}
      </div>

      {/* Swiper */}
      <div ref={containerRef} className="swiper swiper-container wrap">
        <div className="swiper-wrapper">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/projets/${post.slug.current}`}
              data-post-id={post._id}
              className="swiper-slide thePost"
            >
              <div className="thePost__img">
                <img
                  src={post.thumbnail ? urlFor(post.thumbnail).width(800).url() : ''}
                  alt={post.title}
                />
              </div>
              <div className="thePost__content">
                <h2 className="thePost__title">{post.title}</h2>
                <p className="thePost__terms">{formatCategories(post.categories)}</p>
                <p className="thePost__date">{post.date ? formatDate(post.date) : ''}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="swiper-pagination wrap" />

        <div className="swiper-button">
          <div ref={prevRef} className="swiper-button-prev">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M37 43L26 32L37 21" stroke="white" strokeWidth="4"/>
            </svg>
          </div>
          <div ref={nextRef} className="swiper-button-next">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M27 21L38 32L27 43" stroke="white" strokeWidth="4"/>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
