import { logColour } from '@renegaderocks/utility'
import type { SacredPassedIn } from '../type'

export function sacredLogLedger({
  events,
  observableValue,
  originalValue,
}: SacredPassedIn) {
  console.log(logColour('magenta', 'Original Value'))
  console.log(originalValue)
  console.log(logColour('magenta', 'Events'))
  console.table(events)
  console.log(logColour('magenta', 'Value'))
  console.log(observableValue?.getValue().value)
}
