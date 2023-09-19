import { sacredAggregateAuto, sacredAggregateValue } from './aggregate'
import { sacredLogError } from './log'
import { filter, map, tap, unit } from './unit'
import { isArray, objectCreateFromKeyValue, pipe } from '@renegaderocks/utility'
import type { SacredEvent, SacredEventAdd, SacredPassedIn } from '../type'

function aggregateAuto(input: SacredEventAdd) {
  sacredAggregateAuto({
    events: input.events,
    options: input.options,
    originalValue: input.originalValue,
  })

  return input
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

// Process the event and run any side effects.
function eventPush(input: SacredEventAdd) {
  return pipe(
    map(eventCreate),
    map((newEvent: SacredEvent) => {
      // Check to make sure we have an array to push to since it could be empty.
      if (!input.events) {
        input.events = []
      }

      input.events.push(newEvent)
    }),
  )(unit(input))
}

export function sacredEventAdd(input: SacredEventAdd) {
  // If the sacred is in debug mode then log out the original input.
  if (input.debug === true) console.debug('sacredEventAdd', input)

  return pipe(
    filter(filterChangeOnly),
    filter(filterCheckType),
    tap(eventPush),
    tap(setOriginalValue),
    tap(aggregateAuto),
    tap(upsertObservableValue),
  )(unit(input))
}

// Filters.
function filterChangeOnly(input: SacredEventAdd): boolean {
  const { changeOnly = true, events, value } = input
  const latestEvent = events.length > 0 ? events[events.length - 1] : undefined

  if (changeOnly) {
    if (latestEvent === undefined || latestEvent.value !== value) return true
    return false
  }

  return true
}

function filterCheckType(input: SacredEventAdd): boolean {
  const { checkType = true, originalValue, value } = input

  // Filter out by types.
  if (
    checkType &&
    originalValue !== undefined &&
    typeof originalValue !== typeof value
  ) {
    sacredLogError(
      `The set value is of type "${typeof value}". Expected the type to be "${typeof originalValue}".`,
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

function setOriginalValue({ events, originalValue }: SacredEventAdd) {
  if (originalValue !== undefined) return

  originalValue = events[0].value
}

function upsertObservableValue(input: SacredEventAdd) {
  const { events, observableValue, originalValue } = input

  observableValue?.upsert({
    events,
    originalValue,
    value: sacredAggregateValue({
      events,
      originalValue,
    }),
  })
}
