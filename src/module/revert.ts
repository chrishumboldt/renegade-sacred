import { sacredAggregateValue } from './aggregate'
import type { SacredPassedIn } from '../type'

// Pops the last `steps` raw events and refolds from scratch via
// sacredAggregateValue (a fresh clone of originalValue, safe to fold onto
// by mutation). Reverting isn't reapplied incrementally like a normal
// write, since reversing a merge/unset event isn't well-defined in
// general - a full refold is simpler and correct, and revert isn't a
// hot-path operation.
//
// NOTE: revert can only go back as far as the oldest event still in the
// history. Once eventLimit has collapsed older events into one synthetic
// aggregate event (see sacredAggregateAuto), that collapse is permanent -
// revert cannot see past it.
export function sacredRevert(
  { events, observableValue, originalValue }: SacredPassedIn,
  steps = 1,
): void {
  if (steps <= 0 || events.length === 0) return

  events.splice(Math.max(0, events.length - steps), steps)

  const value = sacredAggregateValue({ events, originalValue })

  observableValue?.upsert({ events, originalValue, value })
}
