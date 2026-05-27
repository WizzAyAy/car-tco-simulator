import type { MaybeRefOrGetter } from 'vue'
import { useTitle } from '@vueuse/core'
import { toValue, watchEffect } from 'vue'

const DEFAULT_DESCRIPTION
  = 'Compare le coût total d\'usage (TCO) de deux voitures : carburant ou électricité, '
    + 'entretien, assurance, dépréciation, malus et financement, tout inclus.'

function setMetaDescription(content: string): void {
  if (typeof document === 'undefined') return
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.name = 'description'
    document.head.appendChild(tag)
  }
  tag.content = content
}

/**
 * Reactively drives the document <title> (via VueUse `useTitle`) and the
 * `<meta name="description">` tag. Both accept refs/getters so SEO pages can
 * update metadata as the underlying data changes, without touching index.html.
 */
export function usePageMeta(
  title: MaybeRefOrGetter<string>,
  description?: MaybeRefOrGetter<string>,
): void {
  useTitle(() => toValue(title))
  watchEffect(() => {
    setMetaDescription(toValue(description) ?? DEFAULT_DESCRIPTION)
  })
}
