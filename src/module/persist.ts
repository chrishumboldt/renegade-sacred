import { sacred } from './sacred'
import type { Sacred, SacredInput, SacredSerialized } from '../type'

// sacred() already accepts an `events` array to rebuild its history from,
// so serialize/hydrate just make that round-trip explicit and JSON-safe.
// Where to actually store the result (localStorage, a DB, ...) stays the
// app's job.
export function sacredHydrate<T>(
  data: SacredSerialized<T>,
  options: Omit<SacredInput, 'events'> = {},
): Sacred<T> {
  return sacred<T>(data.value, { ...options, events: data.events })
}

export function sacredSerialize<T>(
  sacredThing: Sacred<T>,
): SacredSerialized<T> {
  return {
    value: sacredThing.getOriginalValue(),
    // Defensive copy so a caller serializing right before another write
    // doesn't end up holding a reference into live, still-mutating state.
    events: [...sacredThing.getEvents()],
  }
}
