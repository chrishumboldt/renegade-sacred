import { sacred } from './sacred'
import type { Sacred, SacredMergeOptions, SacredMergeValues } from '../type'

export function sacredMerge<T extends readonly Sacred<any>[]>(
  sacreds: [...T],
  options: SacredMergeOptions = {},
) {
  // The array starts empty and is populated synchronously below, before
  // anything can observe it, so this cast is safe.
  const result = sacred<SacredMergeValues<T>>(
    [] as unknown as SacredMergeValues<T>,
    options,
  )
  let subscriberCount = 0

  // Keep the result in sync with every source sacred for the lifetime of
  // the merge.
  const sourceObservers = sacreds.map((sourceSacred, index) => {
    return sourceSacred.observe(({ value }) => {
      result.upsert(value, { key: index })
    })
  })

  // Return the observer function. Each call gets its own independent
  // subscription (mirrors Sacred.observe, which supports many concurrent
  // observers) so unobserving one caller never affects another.
  return {
    observe(
      effectInput: (value: SacredMergeValues<T>) => void,
      triggerOnObserve = true,
    ) {
      subscriberCount += 1

      const resultObserver = result.observe(
        ({ value }) => effectInput(value),
        triggerOnObserve,
      )

      return {
        unobserve() {
          resultObserver.unobserve()
          subscriberCount -= 1

          // Only tear down the source subscriptions once nobody is left
          // listening to the merge.
          if (subscriberCount === 0) {
            sourceObservers.forEach(observer$ => observer$.unobserve())
          }
        },
      }
    },
  }
}
