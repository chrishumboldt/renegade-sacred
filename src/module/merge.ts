import { sacred } from './sacred'
import type { ObservableEffectMerge, Observer, Sacred } from '../type'

export function sacredMerge(sacreds: Sacred[]) {
  let effect: (input: any[]) => void
  const observersList: Observer[] = []
  const result = sacred<any[]>({ value: [] })

  // Iterate over the sacreds and observe them.
  sacreds.forEach((sacred, index) => {
    observersList.push(
      sacred.observe(({ value }) => {
        result.upsert({ key: index, value })
      }),
    )
  })

  // Observe the result.
  const result$ = result.observe(({ value }: any) => {
    effect && effect(value)
  })

  // Return the observer function.
  return {
    observe(effectInput: ObservableEffectMerge, triggerOnObserve = true) {
      effect = effectInput

      // Trigger immediately.
      if (triggerOnObserve) effectInput && effectInput(result.getValue())

      return {
        unobserve() {
          observersList.forEach(observer$ => observer$.unobserve())
          result$.unobserve()
        },
      }
    },
  }
}
