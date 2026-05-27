import type { MaybeRefOrGetter } from 'vue'
import { useTitle } from '@vueuse/core'
import { toValue, watchEffect } from 'vue'

const DEFAULT_DESCRIPTION
  = 'Compare le coût total d\'usage (TCO) de deux voitures : carburant ou électricité, '
    + 'entretien, assurance, dépréciation, malus et financement, tout inclus.'

function setMetaDescription(content: string): void {
  if (typeof document === 'undefined')
    return
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = 'description'
    document.head.appendChild(tag)
  }
  tag.content = content
}

function setMetaTag(selector: string, attr: 'property' | 'name', key: string, content: string): void {
  if (typeof document === 'undefined')
    return
  let tag = document.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.content = content
}

function setSocialTitle(title: string): void {
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title)
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title)
}

function setSocialDescription(description: string): void {
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description)
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description)
}

function setSocialImage(image: string): void {
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', image)
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image)
}

/**
 * Reactively drives the document <title> (via VueUse `useTitle`), the
 * `<meta name="description">` tag and the matching `og:*` / `twitter:*` title
 * and description tags. Every argument accepts refs/getters so SEO pages can
 * update metadata as the underlying data changes, without touching index.html.
 * The static tags in index.html act as the fallback before this runs.
 */
export function usePageMeta(
  title: MaybeRefOrGetter<string>,
  description?: MaybeRefOrGetter<string>,
): void {
  useTitle(() => toValue(title))

  watchEffect(() => {
    const resolvedTitle = toValue(title)
    const resolvedDescription = toValue(description) ?? DEFAULT_DESCRIPTION
    setMetaDescription(resolvedDescription)
    setSocialTitle(resolvedTitle)
    setSocialDescription(resolvedDescription)
  })
}

/**
 * Reactively drives the `og:image` / `twitter:image` tags from an absolute URL
 * (e.g. built via `window.location.origin`). Kept separate from `usePageMeta`
 * so a wrapper component can own the title/description while a child remains
 * the single source of truth for the social card image.
 */
export function useSocialImage(image: MaybeRefOrGetter<string | undefined>): void {
  watchEffect(() => {
    const resolved = toValue(image)
    if (resolved)
      setSocialImage(resolved)
  })
}
