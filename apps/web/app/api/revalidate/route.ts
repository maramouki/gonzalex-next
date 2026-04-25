import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Server misconfiguration: missing REVALIDATE_SECRET' }, { status: 500 })
  }

  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  let body: { _type?: string; slug?: { current?: string } }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const type = body._type

  if (type === 'projet') {
    const slug = body.slug?.current
    revalidatePath('/')
    if (slug) revalidatePath(`/projets/${slug}`)
  } else if (type === 'aPropos') {
    revalidatePath('/a-propos')
  } else if (type === 'settings') {
    revalidatePath('/')
    revalidatePath('/a-propos')
  } else {
    revalidatePath('/')
  }

  return NextResponse.json({ revalidated: true, type })
}
