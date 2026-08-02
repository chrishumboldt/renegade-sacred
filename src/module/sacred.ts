import { sacredAggregateValue } from './aggregate'
import { sacredEventsCollapse } from './event'
import { sacredLogLedger } from './log-ledger'
import { observable } from './observable'
import { sacredRevert } from './revert'
import { sacredUnset } from './unset'
import { sacredUpsert } from './upsert'
import type {
  ObservableEffect,
  Sacred,
  SacredEvent,
  SacredEventUnset,
  SacredEventUpsert,
  SacredInput,
  SacredOptions,
} from '../type'

// Create a sacred thing. Once this is done it can no longer be changed but
// can be "derived" over time. This follows the principle of immutabilty but
// with a different approach. Instead of mutation we create events of
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
export function sacred<T = unknown>({
  changeOnly = false,
  debug,
  eventLimit = 1000,
  events: inputEvents = [],
  sideEffect,
  triggerOnCreate = false,
  value,
}: SacredInput<T>): Sacred<T> {
  const events: SacredEvent[] = inputEvents
  const options: SacredOptions = { eventLimit }
  const originalValue: any = value // This never changes!

  // Set observable value.
  const observableValue = observable({
    sideEffect,
    triggerOnCreate,
    value: {
      events,
      originalValue,
      value: sacredAggregateValue({ events, originalValue }),
    },
  })

  // Return.
  return {
    collapseEvents() {
      return sacredEventsCollapse({ events, originalValue })
    },
    getEvents(): SacredEvent[] {
      return events
    },
    getObserverCount() {
      return observableValue.getObserverCount()
    },
    getOptions(): SacredOptions {
      return options
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
    revert(steps = 1) {
      return sacredRevert({ events, observableValue, originalValue }, steps)
    },
    unset(input: SacredEventUnset) {
      return sacredUnset({
        debug,
        events,
        observableValue,
        originalValue,
        options,
      })(input)
    },
    upsert(input: SacredEventUpsert<T>) {
      return sacredUpsert({
        changeOnly,
        debug,
        events,
        observableValue,
        originalValue,
        options,
      })(input)
    },
  }
}
