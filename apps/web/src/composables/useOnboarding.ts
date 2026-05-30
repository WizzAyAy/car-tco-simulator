import { useStorage } from '@vueuse/core'

// Bump the version suffix to force every visitor through the gate again
// (e.g. after a structural wizard change).
const STORAGE_KEY = 'cts:onboarded:v1'

const onboarded = useStorage(STORAGE_KEY, false)

export function useOnboarding() {
  function markOnboarded() {
    onboarded.value = true
  }
  function resetOnboarding() {
    onboarded.value = false
  }
  return { onboarded, markOnboarded, resetOnboarding }
}
