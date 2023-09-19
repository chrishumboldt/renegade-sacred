import { Observable, ObservableEffect, Observer } from './observable'

export interface Sacred<T = any> {
  collapseEvents: () => void
  getEvents: () => SacredEvent[]
  getObserverCount: () => number
  getOptions: () => SacredOptions
  getOriginalValue: () => any
  getValue: () => T
  getValueType: () => any
  logLedger: () => void
  observe: (effet: ObservableEffect, triggerOnObserve?: boolean) => Observer
  unset: (input: SacredEventUnset) => void
  upsert: (input: SacredEventUpsert) => void
}

export interface SacredAggregateAuto {
  events: SacredEvent[]
  options: SacredOptions
  originalValue: any
}

export interface SacredAggregateRunCheck {
  debug?: boolean
  eventBuffer?: number
  eventLength?: number
  interval?: number
}

export interface SacredAggregateValue {
  aggregate: any
  event: SacredEvent
  sacredType: string
}

export interface SacredEffect<T = unknown> {
  events: SacredEvent<T>[]
  originalValue: T
  value: T
}

export interface SacredEvent<T = unknown> {
  metadata?: {
    eventTimestamp?: number
    signature?: string
    upsertKey?: number | string
  }
  type: string
  value: T
}

export interface SacredEventAdd extends SacredEventChange {
  changeOnly?: boolean
  checkType?: boolean
  debug?: boolean
  events: SacredEvent[]
  key?: number | string
  options: SacredOptions
  originalValue: any
  type: string
  value: any
}

interface SacredEventChange {
  observableValue?: Observable
  signature?: any
}

export interface SacredEventUnset extends SacredEventChange {
  key?: number | string
}

export interface SacredEventUpsert extends SacredEventChange {
  key?: number | string
  value: any
}

export interface SacredInput {
  changeOnly?: boolean
  debug?: boolean
  eventLimit?: number
  events?: SacredEvent[]
  sideEffect?: ObservableEffect[]
  triggerOnCreate?: boolean
  value: any
}

export interface SacredOptions {
  eventLimit?: number
}

export interface SacredPassedIn {
  changeOnly?: boolean
  debug?: boolean
  events: SacredEvent[]
  observableValue?: Observable
  options?: SacredOptions
  originalValue: any
}
