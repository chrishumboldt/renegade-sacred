import { observable } from './observable'
import { sacredAggregateValue } from './aggregate'
import { sacredEventsCollapse } from './event'
import { sacredLogLedger } from './log-ledger'
import { sacredReset } from './reset'
import { sacredRevert } from './revert'
import { sacredUnset } from './unset'
import { sacredUpsert } from './upsert'
import type {
  ObservableEffect,
  Sacred,
  SacredEvent,
  SacredInput,
  SacredNoAggregate,
  SacredOptions,
  SacredUnsetOptions,
  SacredUpsertOptions,
} from '../type'

// Create a sacred thing. Once this is done it can no longer be changed but
// can be "derived" over time. This follows the principle of immutability
// but with a different approach. Instead of mutation we create events of
// "change". We can therefore determine its value at time of call without
// fear of failure.
//
// The inspiration of this is immutable trees that instead of copying and
// returning a new value, return the current state of change. We can
// apply this change history without mutation by overlaying the principle
// of events.
//
// NOTE: Types matter in sacred values. You cannot change the type!!!! It
// will error.
export function sacred<T>(
  value: T,
  options: SacredInput & { aggregate: false },
): SacredNoAggregate<T>
export function sacred<T = unknown>(value: T, options?: SacredInput): Sacred<T>
export function sacred<T = unknown>(
  value: T,
  {
    aggregate = true,
    changeOnly = false,
    debug,
    eventLimit = 1000,
    events: inputEvents = [],
    sideEffect,
    triggerOnCreate = false,
  }: SacredInput = {},
): Sacred<T> {
  const events: SacredEvent[] = inputEvents
  const runtimeOptions: SacredOptions = { aggregate, eventLimit }
  const originalValue: any = value // This never changes!

  // Set observable value.
  const observableValue = observable({
    sideEffect,
    triggerOnCreate,
    value: {
      events,
      originalValue,
      value: sacredAggregateValue({
        events,
        options: runtimeOptions,
        originalValue,
      }),
    },
  })

  // Return.
  return {
    collapseEvents() {
      return sacredEventsCollapse({
        events,
        options: runtimeOptions,
        originalValue,
      })
    },
    getEvents(): SacredEvent[] {
      return events
    },
    getObserverCount() {
      return observableValue.getObserverCount()
    },
    getOptions(): SacredOptions {
      return runtimeOptions
    },
    getOriginalValue() {
      return originalValue
    },
    getValue(): T {
      return observableValue.getValue().value as T
    },
    getValueType() {
      return typeof value
    },
    logLedger() {
      return sacredLogLedger({ events, observableValue, originalValue })
    },
    observe(effect: ObservableEffect, triggerOnObserve = true) {
      return observableValue.observe(effect, triggerOnObserve)
    },
    reset() {
      return sacredReset({ events, observableValue, originalValue })
    },
    revert(steps = 1) {
      return sacredRevert(
        { events, observableValue, options: runtimeOptions, originalValue },
        steps,
      )
    },
    unset(key: number | string, unsetOptions: SacredUnsetOptions = {}) {
      return sacredUnset({
        debug,
        events,
        observableValue,
        originalValue,
        options: runtimeOptions,
      })({ key, signature: unsetOptions.signature ?? false })
    },
    upsert(value: any, upsertOptions: SacredUpsertOptions = {}) {
      return sacredUpsert({
        changeOnly,
        debug,
        events,
        observableValue,
        originalValue,
        options: runtimeOptions,
      })({
        key: upsertOptions.key,
        // aggregate: false forces every whole-value write to replace,
        // regardless of what's passed. This is the sugar the type
        // system already enforces (SacredNoAggregate has no keyed
        // overload, so upsertOptions.key is always undefined here).
        replace: aggregate === false ? true : upsertOptions.replace,
        signature: upsertOptions.signature ?? false,
        value,
      })
    },
  }
}
