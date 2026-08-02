import { Observable, ObservableEffect, Observer } from './observable'

export type Sacred<T = any> = {
  collapseEvents: () => void
  getEvents: () => SacredEvent[]
  getObserverCount: () => number
  getOptions: () => SacredOptions
  getOriginalValue: () => any
  getValue: () => T
  getValueType: () => any
  logLedger: () => void
  observe: (effect: ObservableEffect, triggerOnObserve?: boolean) => Observer
  unset: (input: SacredEventUnset) => void
  upsert: (input: SacredEventUpsert<T>) => void
}

export type SacredAggregateAuto = {
  events: SacredEvent[]
  options: SacredOptions
  originalValue: any
}

export type SacredAggregateRunCheck = {
  debug?: boolean
  eventBuffer?: number
  eventLength?: number
  interval?: number
}

export type SacredAggregateValue = {
  aggregate: any
  event: SacredEvent
  sacredType: string
}

export type SacredEffect<T = unknown> = {
  events: SacredEvent<T>[]
  originalValue: T
  value: T
}

export type SacredEvent<T = unknown> = {
  metadata?: {
    eventTimestamp?: number
    signature?: string
    upsertKey?: number | string
  }
  type: string
  value: T
}

export type SacredEventAdd = SacredEventChange & {
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

type SacredEventChange = {
  observableValue?: Observable
  signature?: any
}

export type SacredEventUnset = SacredEventChange & {
  key?: number | string
}

// Upserting the whole value (no key) must match the sacred's type T.
// Upserting via a key path targets a nested slice of T, which isn't
// practically type-checkable against a string path, so it stays loose.
export type SacredEventUpsert<T = any> =
  | (SacredEventChange & { key?: undefined; value: T })
  | (SacredEventChange & { key: number | string; value: any })

export type SacredInput<T = any> = {
  changeOnly?: boolean
  debug?: boolean
  // Caps how many events accumulate before older ones are collapsed into
  // one aggregate. Defaults to 1000 so writes to object/array sacreds stay
  // cheap without you having to think about it. Pass 0 for unlimited.
  eventLimit?: number
  events?: SacredEvent[]
  sideEffect?: ObservableEffect[]
  triggerOnCreate?: boolean
  value: T
}

export type SacredMergeOptions = Omit<SacredInput<any[]>, 'value'>

// Maps a tuple of sacreds to a tuple of their value types, positionally,
// e.g. [Sacred<string>, Sacred<number>] -> [string, number].
export type SacredMergeValues<T extends readonly Sacred<any>[]> = {
  [K in keyof T]: T[K] extends Sacred<infer V> ? V : never
}

export type SacredOptions = {
  eventLimit?: number
}

export type SacredPassedIn = {
  changeOnly?: boolean
  debug?: boolean
  events: SacredEvent[]
  observableValue?: Observable
  options?: SacredOptions
  originalValue: any
}
