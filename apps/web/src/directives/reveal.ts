import type { Directive } from 'vue'

/**
 * `v-reveal` — fades + lifts an element into view on first intersection.
 * Pairs with the `.reveal` / `.is-visible` utilities in main.css.
 * Honors `prefers-reduced-motion` (CSS short-circuits the transition).
 */
const observer
  = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              obs.unobserve(entry.target)
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )
    : null

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value)
      el.style.transitionDelay = `${binding.value}ms`
    if (observer)
      observer.observe(el)
    else el.classList.add('is-visible')
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
