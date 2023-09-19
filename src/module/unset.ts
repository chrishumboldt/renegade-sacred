import { sacredEventAdd } from './event'
import { sacredLogError } from './log'
import type { SacredEventUnset, SacredPassedIn } from '../type'

export function sacredUnset({
  events,
  observableValue,
  originalValue,
  options = {},
}: SacredPassedIn) {
  return ({ key, signature = false }: SacredEventUnset) => {
    if (typeof originalValue !== 'object') {
      sacredLogError(`Unset can only be run on objects.`)
      return
    }

    sacredEventAdd({
      checkType: false,
      events,
      observableValue,
      originalValue,
      options,
      signature,
      type: 'unset',
      value: typeof key === 'number' ? `[${key}]` : key,
    })
  }
}
