import { client } from '@/lib/sanity.client'
import { allProjectsQuery, settingsQuery } from '@/lib/queries'
import { HomeSlider } from '@/components/HomeSlider'

export const dynamic = 'force-static'

export default async function HomePage() {
  const [posts, settings] = await Promise.all([
    client.fetch(allProjectsQuery),
    client.fetch(settingsQuery),
  ])

  return (
    <div className="main-layout">
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

      <main className="main-layout__main">
        <HomeSlider posts={posts ?? []} />
      </main>
    </div>
  )
}
