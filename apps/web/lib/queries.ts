import { groq } from 'next-sanity'

export const allProjectsQuery = groq`
  *[_type == "projet"] | order(date desc) {
    _id,
    title,
    slug,
    thumbnail,
    bgImage,
    categories,
    date
  }
`

export const allSlugsQuery = groq`
  *[_type == "projet"] { "slug": slug.current }
`

export const projectBySlugQuery = groq`
  *[_type == "projet" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    thumbnail,
    bgImage,
    categories,
    date,
    desc,
    items,
    gallery
  }
`

export const allProjectsForNextQuery = groq`
  *[_type == "projet"] | order(date desc) {
    _id,
    title,
    slug,
    thumbnail
  }
`

export const aProposQuery = groq`
  *[_type == "aPropos"][0] {
    title,
    desc,
    imgPrez,
    serviceH2,
    services,
    imgFull,
    parcoursH2,
    parcours
  }
`

export const settingsQuery = groq`
  *[_type == "settings"][0] {
    mail,
    textLoader
  }
`
