import { notFound } from 'next/navigation'
import { client } from '@/lib/sanity.client'
import { projectBySlugQuery, allSlugsQuery, allProjectsForNextQuery, settingsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/urlFor'
import { PortableText } from '@/components/PortableText'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'

type ProjectItem = { infotitle: string; infodetails: string }
type GalleryImage = { asset?: { metadata?: { dimensions?: { width: number; height: number } } } }
type NextProjectPost = { _id: string; title: string; slug: { current: string }; thumbnail: any }

export const revalidate = false

export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
  return slugs.map((s) => ({ slug: s.slug }))
}

export default async function ProjetPage({ params }: { params: { slug: string } }) {
  const [post, allPosts, settings] = await Promise.all([
    client.fetch(projectBySlugQuery, { slug: params.slug }),
    client.fetch(allProjectsForNextQuery),
    client.fetch(settingsQuery),
  ])

  if (!post) notFound()

  const otherPosts = (allPosts as NextProjectPost[]).filter((p) => p._id !== post._id)
  const nextPost = otherPosts[0] ?? null

  return (
    <div className="single">
      <Header />
      <main>
      {/* Header projet */}
      <section className="projet-header wrap">
        <h1 className="projet-header__title">{post.title}</h1>
        {post.thumbnail && (
          <div className="projet-header__img">
            <Image
              src={urlFor(post.thumbnail).width(1200).url()}
              alt={post.title}
              width={post.thumbnail.asset?.metadata?.dimensions?.width ?? 1200}
              height={post.thumbnail.asset?.metadata?.dimensions?.height ?? 800}
            />
          </div>
        )}
      </section>

      {/* Contenu principal */}
      <section className="projet-main wrap">
        <div className="projet-content">
          {post.items?.map((item: ProjectItem, i: number) => (
            <div key={i} className="content__info">
              <p className="text-small">{item.infotitle}</p>
              <p className="text-small details">{item.infodetails}</p>
            </div>
          ))}
          <div className="content-desc">
            {post.desc && <PortableText value={post.desc} />}
          </div>
        </div>

        {post.gallery?.map((img: GalleryImage, i: number) => (
          <div key={i} className="projet__img">
            <Image
              src={urlFor(img).width(1400).url()}
              alt=""
              width={img.asset?.metadata?.dimensions?.width ?? 1400}
              height={img.asset?.metadata?.dimensions?.height ?? 900}
            />
          </div>
        ))}
      </section>

      {/* Projet suivant */}
      {nextPost && (
        <section className="post wrap">
          <p className="more-project">Plus de projet</p>
          <article className="the-post">
            <Link href={`/projets/${nextPost.slug.current}`}>
              <div className="the-post__image">
                {nextPost.thumbnail && (
                  <Image
                    src={urlFor(nextPost.thumbnail).width(800).url()}
                    alt={nextPost.title}
                    width={800}
                    height={500}
                  />
                )}
              </div>
              <section className="the-post__content">
                <h2 className="the-post__title display-xl">{nextPost.title}</h2>
              </section>
            </Link>
          </article>
        </section>
      )}

      {/* Mail */}
      <section className="mail wrap">
        <a href={`mailto:${settings?.mail}`} className="display">
          {settings?.mail}
        </a>
      </section>
    </main>
      <Footer />
    </div>
  )
}
