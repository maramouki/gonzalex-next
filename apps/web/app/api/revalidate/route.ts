import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const body = await request.json()
  const type = body._type as string | undefined

  if (type === 'projet') {
    const slug = body.slug?.current as string | undefined
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
