import { sacredLogError } from './log'
import { stringRandom } from './string'
import type {
  Observable,
  ObservableEffect,
  ObservableInput,
  Observer,
} from '../type'

// Run an effect without letting it take down the rest of a broadcast.
function effectRun(effect: ObservableEffect, value: any) {
  try {
    effect(value)
  } catch (error) {
    sacredLogError(`An observer threw an error: ${error}`)
  }
}

export function observable({
  sideEffect = [],
  triggerOnCreate = false,
  value,
}: ObservableInput): Observable {
  let observableValue: any = value
  const effects: Map<string, ObservableEffect> = new Map()

  // Iterate over the side effects and store in the effects map. Also
  // run the effect immediately if required.
  for (let effect of sideEffect) {
    effects.set(`side/effect/${stringRandom()}`, effect)
    triggerOnCreate && effectRun(effect, observableValue)
  }

  return {
    getObserverCount() {
      return effects.size
    },
    getValue() {
      return observableValue
    },
    observe(effect: ObservableEffect, triggerOnObserve = true): Observer {
      const id = `observe/effect/${stringRandom()}`

      effects.set(id, effect)

      // Trigger the effect immediately if required.
      if (triggerOnObserve) {
        effect(observableValue)
      }

      // Return a release function to unobserve as needed.
      return {
        getObserverId: () => id,
        unobserve: () => effects.delete(id),
      }
    },
    upsert(newValue: any) {
      observableValue = newValue

      if (effects.size < 1) return

      // Iterate over the effects and broadcast the value. One observer
      // throwing must not stop the rest from being notified.
      effects.forEach(effect => effectRun(effect, observableValue))
    },
  }
}
