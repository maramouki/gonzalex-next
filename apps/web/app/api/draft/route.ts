import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  if (searchParams.get('disable')) {
    ;(await draftMode()).disable()
    redirect('/')
  }

  const secret = searchParams.get('secret')
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }

  ;(await draftMode()).enable()

  const slug = searchParams.get('slug')
  redirect(slug ? `/projets/${slug}` : '/')
}
