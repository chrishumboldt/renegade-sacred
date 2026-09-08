import { sacredEventAdd } from './event'
import type { SacredEventUpsert, SacredPassedIn } from '../type'

export function sacredUpsert({
  changeOnly,
  debug,
  events,
  observableValue,
  originalValue,
  options = {},
}: SacredPassedIn) {
  return ({ key, replace, signature = false, value }: SacredEventUpsert) => {
    sacredEventAdd({
      changeOnly,
      checkType: key === undefined,
      debug,
      events,
      key,
      observableValue,
      originalValue,
      options,
      replace,
      signature,
      type: 'upsert',
      value,
    })
  }
}
