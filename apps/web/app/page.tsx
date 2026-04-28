import { client } from '@/lib/sanity.client'
import { allProjectsQuery, settingsQuery } from '@/lib/queries'
import { HomeSlider } from '@/components/HomeSlider'
import { LoaderController } from '@/components/LoaderController'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const revalidate = false

export default async function HomePage() {
  const [posts, settings] = await Promise.all([
    client.fetch(allProjectsQuery),
    client.fetch(settingsQuery),
  ])

  return (
    <div className="home">
      <LoaderController />

      {/* Loader */}
      <div className="loader">
        <h2>{settings?.textLoader ?? ''}</h2>
        <div className="textLoading">
          Loading
          <div className="lds-ellipsis">
            <div /><div /><div /><div />
          </div>
        </div>
      </div>

      <Header />

      <main className="main-layout__main">
        <HomeSlider posts={posts ?? []} />
      </main>

      <Footer />
    </div>
  )
}
