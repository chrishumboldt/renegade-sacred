import { isArray } from './is'
import { sacredLogError } from './log'
import { objectCreateFromKeyValue } from './object'
import { pipe, tap } from './pipe'
import type { SacredEvent, SacredEventAdd, SacredPassedIn } from '../type'
import {
  sacredAggregateAuto,
  sacredAggregateValue,
  sacredAggregateValueApplyImmutable,
} from './aggregate'

function aggregateAuto(input: SacredEventAdd): void {
  sacredAggregateAuto({
    events: input.events,
    options: input.options,
    originalValue: input.originalValue,
  })
}

function eventCreate(input: SacredEventAdd): SacredEvent {
  const { key, replace, signature, type, value } = input
  const sacredEvent: SacredEvent = {
    metadata: {
      eventTimestamp: Date.now(),
      signature,
    },
    type,
    value,
  }

  // Only set when true, same as upsertKey below, so an ordinary event's
  // metadata doesn't carry a spurious replace: undefined key.
  if (replace) sacredEvent.metadata!.replace = true

  if (key !== undefined) {
    if (typeof key === 'string' && replace) {
      // Keep the raw value and path rather than building a nested
      // partial object: sacredAggregateValueUpsert(Immutable) uses
      // the path to replace just that key outright (see objectSet),
      // instead of merging the constructed nested object in.
      sacredEvent.metadata!.upsertKey = key
    } else if (typeof key === 'string') {
      sacredEvent.value = objectCreateFromKeyValue({ key, value })
    } else if (typeof key === 'number') {
      sacredEvent.metadata!.upsertKey = key
    }
  }

  return sacredEvent
}

// Create the event for this change and push it onto the event history.
function eventPush(input: SacredEventAdd): void {
  const newEvent = eventCreate(input)

  // Check to make sure we have an array to push to since it could be empty.
  if (!input.events) {
    input.events = []
  }

  input.events.push(newEvent)
}

function filterAggregateSupported(input: SacredEventAdd): boolean {
  const { key, options, type } = input

  if (options.aggregate !== false) return true
  if (type !== 'unset' && key === undefined) return true

  sacredLogError(
    type === 'unset'
      ? 'unset() is not supported on a sacred created with { aggregate: false }. Only whole-value upsert() is allowed.'
      : 'A keyed upsert() is not supported on a sacred created with { aggregate: false }. Only whole-value upsert() is allowed.',
  )

  return false
}

function filterChangeOnly(input: SacredEventAdd): boolean {
  const { changeOnly = true, events, value } = input

  if (!changeOnly) return true

  const latestEvent = events.length > 0 ? events[events.length - 1] : undefined
  if (latestEvent === undefined) return true

  const isSame =
    typeof changeOnly === 'function'
      ? changeOnly(latestEvent.value, value)
      : latestEvent.value === value

  return !isSame
}

function filterCheckType(input: SacredEventAdd): boolean {
  const { checkType = true, originalValue, value } = input

  if (!checkType || originalValue === undefined) return true

  const originalType = sacredTypeLabel(originalValue)
  const valueType = sacredTypeLabel(value)

  if (originalType !== valueType) {
    sacredLogError(
      `The set value is of type "${valueType}". Expected the type to be "${originalType}".`,
    )

    return false
  }

  return true
}

function filterReplaceSupported(input: SacredEventAdd): boolean {
  const { key, replace } = input

  if (!replace || key === undefined) return true
  if (typeof key === 'string') return true

  sacredLogError(
    'A number-keyed (array index) upsert() cannot also set replace: true, since an array-index upsert already replaces that index outright.',
  )

  return false
}

export function sacredEventAdd(input: SacredEventAdd) {
  // If the sacred is in debug mode then log out the original input.
  if (input.debug === true) console.debug('sacredEventAdd', input)

  if (!filterAggregateSupported(input)) return
  if (!filterChangeOnly(input)) return
  if (!filterCheckType(input)) return
  if (!filterReplaceSupported(input)) return

  pipe(input, tap(eventPush), tap(aggregateAuto), tap(upsertObservableValue))
}

// Aggregate the entire event history into one event.
export function sacredEventsCollapse({
  events,
  options,
  originalValue,
}: SacredPassedIn) {
  // Set the default value since we do not want to fold over the original
  // but still want to match the type.
  let defaultValue = {}

  switch (typeof originalValue) {
    case 'boolean':
      defaultValue = false
      break

    case 'number':
      defaultValue = 0
      break

    case 'object':
      // Only handle the array since the default of the switch statement
      // is an object.
      if (isArray(originalValue)) {
        defaultValue = []
      }
      break

    case 'string':
      defaultValue = ''
      break
  }

  const theAggregate = sacredAggregateValue({
    events,
    options,
    originalValue: defaultValue,
  })

  // Reset the array and set the event history into just the one aggregate.
  // We also added it in as a new event since it is important to know that
  // a collapse occured and when.
  events.length = 0
  events.push({
    metadata: {
      eventTimestamp: Date.now(),
      signature: 'sacredEventsCollapse()',
    },
    type: 'collapse',
    value: theAggregate,
  })
}

// typeof alone can't tell an array or null from a plain object (all three
// report "object"), so they're called out separately here.
function sacredTypeLabel(check: any): string {
  if (check === null) return 'null'
  if (isArray(check)) return 'array'
  return typeof check
}

function upsertObservableValue(input: SacredEventAdd): void {
  const { events, observableValue, options, originalValue } = input

  if (typeof originalValue !== 'object') {
    observableValue?.upsert({
      events,
      originalValue,
      value: sacredAggregateValue({ events, options, originalValue }),
    })
    return
  }

  // Apply just the newest event onto the already-aggregated previous
  // value instead of refolding the whole event history on every write.
  // See sacredAggregateValueApplyImmutable for why this is safe. That
  // function itself checks the newest event's own replace flag, so a
  // whole-value upsert marked replace: true (including every write on
  // an aggregate: false sacred, which stamps this automatically, see
  // sacred.ts) short-circuits to the event's value rather than merging.
  observableValue?.upsert({
    events,
    originalValue,
    value: sacredAggregateValueApplyImmutable({
      aggregate: observableValue?.getValue()?.value,
      event: events[events.length - 1],
      sacredType: isArray(originalValue) ? 'array' : typeof originalValue,
    }),
  })
}
