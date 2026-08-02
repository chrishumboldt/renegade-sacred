import { observable } from './observable'
import type { Sacred, SacredSelectOptions } from '../type'

// Derives a value from a sacred and only notifies its own observers when
// the selected slice actually changes (per isEqual, default Object.is).
// This is cheap because of structural sharing: an untouched branch keeps
// its old reference, so selecting state.ui and writing to state.auth
// never triggers a recompute-and-broadcast here.
export function sacredSelect<T, S>(
  sourceSacred: Sacred<T>,
  selector: (value: T) => S,
  { isEqual = Object.is }: SacredSelectOptions<S> = {},
) {
  const selectedValue = observable({ value: selector(sourceSacred.getValue()) })

  // Already seeded the initial value above, so skip the redundant
  // immediate trigger here.
  const sourceObserver = sourceSacred.observe(({ value }) => {
    const nextSelected = selector(value)

    if (!isEqual(selectedValue.getValue(), nextSelected)) {
      selectedValue.upsert(nextSelected)
    }
  }, false)

  return {
    getValue(): S {
      return selectedValue.getValue()
    },
    observe(effect: (value: S) => void, triggerOnObserve = true) {
      const observer = selectedValue.observe(effect, triggerOnObserve)

      return {
        unobserve() {
          observer.unobserve()

          // Only tear down the source subscription once nobody is left
          // listening to this selection.
          if (selectedValue.getObserverCount() === 0) {
            sourceObserver.unobserve()
          }
        },
      }
    },
  }
}
