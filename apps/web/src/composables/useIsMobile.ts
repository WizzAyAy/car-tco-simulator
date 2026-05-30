import { useMediaQuery } from '@vueuse/core'

// Below Tailwind's `md` breakpoint. Use only where layout must branch in JS
// (e.g. ECharts options); prefer responsive Tailwind classes everywhere else.
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
