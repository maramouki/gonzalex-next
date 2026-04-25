import { groq } from 'next-sanity'

export const allProjectsQuery = groq`
  *[_type == "projet"] | order(date desc) {
    _id,
    title,
    slug,
    thumbnail { asset->{ _id, url }, hotspot, crop },
    bgImage { asset->{ _id, url }, hotspot, crop },
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
    thumbnail { asset->{ _id, url, metadata { dimensions } }, hotspot, crop },
    bgImage { asset->{ _id, url }, hotspot, crop },
    categories,
    date,
    desc,
    items,
    gallery[] { asset->{ _id, url, metadata { dimensions } }, hotspot, crop }
  }
`

export const allProjectsForNextQuery = groq`
  *[_type == "projet"] | order(date desc) {
    _id,
    title,
    slug,
    thumbnail { asset->{ _id, url }, hotspot, crop }
  }
`

export const aProposQuery = groq`
  *[_type == "aPropos"][0] {
    title,
    desc,
    imgPrez { asset->{ _id, url, metadata { dimensions } }, hotspot, crop },
    serviceH2,
    services[] {
      serviceTitle,
      serviceDesc
    },
    imgFull { asset->{ _id, url }, hotspot, crop },
    parcoursH2,
    parcours[] { date, status, metier }
  }
`

export const settingsQuery = groq`
  *[_type == "settings"][0] {
    mail,
    textLoader
  }
`
