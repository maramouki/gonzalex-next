'use client'

import { useEffect, useRef } from 'react'
import Swiper from 'swiper'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import Link from 'next/link'
import { urlFor } from '@/lib/urlFor'

type Post = {
  _id: string
  title: string
  slug: { current: string }
  thumbnail: any
  bgImage: any
  categories: string[]
  date: string
}

export function HomeSlider({ posts }: { posts: Post[] }) {
  const swiperRef = useRef<Swiper | null>(null)
  const prevRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!prevRef.current || !nextRef.current) return

    swiperRef.current = new Swiper('.swiper', {
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

          function showBG(id: number) {
            const bgImages = Array.from(
              document.querySelectorAll<HTMLImageElement>('.bg-container > img')
            )
            bgImages[id]?.style.setProperty('animation', 'fadeIn 0.5s ease-out forwards')
          }

          function hideBG(id: number) {
            const bgImages = Array.from(
              document.querySelectorAll<HTMLImageElement>('.bg-container > img')
            )
            bgImages[id]?.style.setProperty('animation', 'fadeOut 0.3s ease-out forwards')
          }

          slides.forEach((slide, index) => {
            const image = slide.querySelector('img')
            if (!image) return
            image.setAttribute('data-swiper-index', String(index))
            image.addEventListener('mouseover', () => {
              if (index === swiper.activeIndex) showBG(index)
            })
            image.addEventListener('mouseout', () => {
              if (index === swiper.activeIndex) hideBG(index)
            })
          })

          if (window.innerWidth >= 1025) {
            nextRef.current?.addEventListener('mouseover', () =>
              document.querySelector('.swiper')?.classList.add('next-is-hover')
            )
            nextRef.current?.addEventListener('mouseout', () =>
              document.querySelector('.swiper')?.classList.remove('next-is-hover')
            )
            prevRef.current?.addEventListener('mouseover', () =>
              document.querySelector('.swiper')?.classList.add('prev-is-hover')
            )
            prevRef.current?.addEventListener('mouseout', () =>
              document.querySelector('.swiper')?.classList.remove('prev-is-hover')
            )
          }
        },
      },
    })

    return () => {
      swiperRef.current?.destroy(true, true)
    }
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

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
      <div className="swiper swiper-container wrap">
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
                <h1 className="thePost__title">{post.title}</h1>
                <p className="thePost__terms">{post.categories?.join(', ')}</p>
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
