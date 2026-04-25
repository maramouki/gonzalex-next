'use client'

import { PortableText as SanityPortableText } from '@portabletext/react'
import type { TypedObject } from '@portabletext/types'

export function PortableText({ value }: { value: TypedObject[] }) {
  return <SanityPortableText value={value} />
}
