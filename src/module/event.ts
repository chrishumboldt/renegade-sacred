import { isArray } from './is'
import { objectCreateFromKeyValue } from './object'
import { pipe, tap } from './pipe'
import type { SacredEvent, SacredEventAdd, SacredPassedIn } from '../type'
import {
  sacredAggregateAuto,
  sacredAggregateValue,
  sacredAggregateValueApplyImmutable,
} from './aggregate'
import { sacredLogError } from './log'

function aggregateAuto(input: SacredEventAdd): void {
  sacredAggregateAuto({
    events: input.events,
    options: input.options,
    originalValue: input.originalValue,
  })
}

function eventCreate(input: SacredEventAdd): SacredEvent {
  const { key, signature, type, value } = input
  const sacredEvent: SacredEvent = {
    metadata: {
      eventTimestamp: Date.now(),
      signature,
    },
    type,
    value,
  }

  if (key !== undefined) {
    if (typeof key === 'string') {
      // Object key type.
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

export function sacredEventAdd(input: SacredEventAdd) {
  // If the sacred is in debug mode then log out the original input.
  if (input.debug === true) console.debug('sacredEventAdd', input)

  if (!filterChangeOnly(input)) return
  if (!filterCheckType(input)) return

  pipe(input, tap(eventPush), tap(aggregateAuto), tap(upsertObservableValue))
}

// Filters.
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

// typeof alone can't tell an array or null from a plain object (all three
// report "object"), so they're called out separately here.
function sacredTypeLabel(check: any): string {
  if (check === null) return 'null'
  if (isArray(check)) return 'array'
  return typeof check
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

// Aggregate the entire event history into one event.
export function sacredEventsCollapse({
  events,
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

function upsertObservableValue(input: SacredEventAdd): void {
  const { events, observableValue, originalValue } = input

  if (typeof originalValue !== 'object') {
    observableValue?.upsert({
      events,
      originalValue,
      value: sacredAggregateValue({ events, originalValue }),
    })
    return
  }

  // Apply just the newest event onto the already-aggregated previous
  // value instead of refolding the whole event history on every write -
  // see sacredAggregateValueApplyImmutable for why this is safe.
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
