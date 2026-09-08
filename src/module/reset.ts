import type { SacredPassedIn } from '../type'

// Clears the entire event history and returns the sacred to exactly the
// value it was constructed with. Unlike revert(), this isn't limited by
// an eventLimit collapse boundary, since there's nothing to fold back
// through, the ledger is emptied outright instead.
export function sacredReset({
  events,
  observableValue,
  originalValue,
}: SacredPassedIn): void {
  events.length = 0

  observableValue?.upsert({ events, originalValue, value: originalValue })
}
