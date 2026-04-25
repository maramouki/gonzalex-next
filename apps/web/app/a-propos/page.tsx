import { client } from '@/lib/sanity.client'
import { aProposQuery, settingsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/urlFor'
import { PortableText } from '@/components/PortableText'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Image from 'next/image'

export const dynamic = 'force-static'

type Service = { serviceTitle: string; serviceDesc: any[] }
type Parcour = { date: string; status: string; metier: string }

export default async function AProposPage() {
  const [page, settings] = await Promise.all([
    client.fetch(aProposQuery),
    client.fetch(settingsQuery),
  ])

  return (
    <>
      <Header />
      <main>
      {/* Header */}
      <section className="gonzalex-header wrap">
        <div className="gonzalex-header__wrapper">
          <div className="gonzalex-header__texts">
            <h1>{page?.title}</h1>
            <div className="header-text">
              {page?.desc && <PortableText value={page.desc} />}
            </div>
          </div>
          {page?.imgPrez && (
            <div className="gonzalex-header__img">
              <Image
                src={urlFor(page.imgPrez).width(800).url()}
                alt={page.title ?? ''}
                width={page.imgPrez.asset?.metadata?.dimensions?.width ?? 600}
                height={page.imgPrez.asset?.metadata?.dimensions?.height ?? 800}
              />
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="services wrap">
        <h2>{page?.serviceH2}</h2>
        <div className="les-services">
          {page?.services?.map((service: Service, i: number) => (
            <div key={i} className="service">
              <p className="caption">{service.serviceTitle}</p>
              <div className="service__text">
                {service.serviceDesc && <PortableText value={service.serviceDesc} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Image pleine largeur */}
      {page?.imgFull && (
        <section className="img-full">
          <Image
            src={urlFor(page.imgFull).width(1920).url()}
            alt=""
            width={1920}
            height={1080}
            style={{ width: '100%', height: 'auto' }}
          />
        </section>
      )}

      {/* Parcours */}
      <section className="parcours wrap">
        <h2>{page?.parcoursH2}</h2>
        {page?.parcours?.map((p: Parcour, i: number) => (
          <div key={i} className="parcour">
            <p className="text-small">{p.date}</p>
            <div className="metier">
              <p className="text-small">{p.status}</p>
              <p>{p.metier}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Mail */}
      <section className="mail wrap">
        <a href={`mailto:${settings?.mail}`} className="display">
          {settings?.mail}
        </a>
      </section>
    </main>
      <Footer />
    </>
  )
}
