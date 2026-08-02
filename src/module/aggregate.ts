import { isArray } from './is'
import {
  objectClone,
  objectMerge,
  objectMergeImmutable,
  objectUnset,
  objectUnsetImmutable,
} from './object'
import type {
  SacredAggregateAuto,
  SacredAggregateValue,
  SacredEvent,
  SacredPassedIn,
} from '../type'

export function sacredAggregateAuto(
  input: SacredAggregateAuto,
): SacredAggregateAuto {
  const { events, options, originalValue } = input
  const { eventLimit } = options!

  if (eventLimit && eventLimit > 0 && events.length > eventLimit) {
    const eventsToAggregate: SacredEvent[] = events?.splice(0, 2)

    const newAggregateValue = sacredAggregateValue({
      events: eventsToAggregate,
      originalValue,
    })

    // Add it to the front of the array keeping the type and metadata. This
    // is guaranteed since the check has already passed.
    events?.unshift(
      Object.assign(eventsToAggregate.pop()!, {
        value: newAggregateValue,
      }),
    )
  }

  return input
}

// Aggregate an object into a value.
export function sacredAggregateValue({
  events = [],
  originalValue,
}: SacredPassedIn) {
  if (typeof originalValue === 'object') {
    return sacredAggregateObjectValue({ events, originalValue })
  }

  return sacredAggregateGenericValue({ events, originalValue })
}

// Get a sacred generic value. No need to fold the events.
function sacredAggregateGenericValue({
  events = [],
  originalValue,
}: SacredPassedIn) {
  return events[events.length - 1]
    ? events[events.length - 1].value
    : originalValue
}

// Aggregate the events in the object type. Always folds onto a fresh,
// privately-owned clone that nothing else can be holding a reference to,
// so it's safe (and cheaper) to apply events by mutation here.
export function sacredAggregateObjectValue({
  events = [],
  originalValue,
}: SacredPassedIn) {
  const sacredType = isArray(originalValue) ? 'array' : typeof originalValue

  return events.reduce(
    (aggregate, event) =>
      sacredAggregateValueApply({ aggregate, event, sacredType }),
    objectClone(originalValue),
  )
}

function sacredAggregateValueApply({
  aggregate,
  event,
  sacredType,
}: SacredAggregateValue) {
  switch (event.type) {
    case 'unset':
      return objectUnset({ key: event.value as string, input: aggregate })

    case 'upsert':
      return sacredAggregateValueUpsert({ aggregate, event, sacredType })

    default:
      return aggregate
  }
}

// Manage and upsert event on the aggregate.
function sacredAggregateValueUpsert({
  aggregate,
  event: { metadata, value },
  sacredType,
}: SacredAggregateValue) {
  // Manage an array upsert by key.
  if (
    sacredType === 'array' &&
    typeof metadata?.upsertKey === 'number' &&
    !isArray(value)
  ) {
    aggregate[metadata?.upsertKey] = value
    return aggregate
  }

  // Manage an array concatenation.
  if (sacredType === 'array' && isArray(value)) {
    return aggregate.concat(value)
  }

  // Manage an object.
  if (sacredType === 'object') {
    return objectMerge(aggregate, value as any)
  }

  // Things went haywire so just return the current aggregate.
  return aggregate
}

// Apply a single event onto an already-aggregated value that might already
// be held externally (e.g. from an earlier getValue()). Used incrementally
// by upsertObservableValue - once, onto the previously cached value -
// instead of refolding the whole event history on every write, which is
// what keeps writes cheap regardless of how much history or accumulated
// state exists. Copy-on-write so old references are never mutated.
export function sacredAggregateValueApplyImmutable({
  aggregate,
  event,
  sacredType,
}: SacredAggregateValue) {
  switch (event.type) {
    case 'unset':
      return objectUnsetImmutable({
        key: event.value as string,
        input: aggregate,
      })

    case 'upsert':
      return sacredAggregateValueUpsertImmutable({
        aggregate,
        event,
        sacredType,
      })

    default:
      return aggregate
  }
}

function sacredAggregateValueUpsertImmutable({
  aggregate,
  event: { metadata, value },
  sacredType,
}: SacredAggregateValue) {
  if (
    sacredType === 'array' &&
    typeof metadata?.upsertKey === 'number' &&
    !isArray(value)
  ) {
    const result = aggregate.slice()
    result[metadata.upsertKey] = value
    return result
  }

  if (sacredType === 'array' && isArray(value)) {
    return aggregate.concat(value)
  }

  if (sacredType === 'object') {
    return objectMergeImmutable(aggregate, value as any)
  }

  return aggregate
}
