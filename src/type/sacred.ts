import type { Observable, ObservableEffect, Observer } from './observable'

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
  // Clears the entire event history and returns to exactly the value
  // passed to sacred() at construction. Unlike revert(), this isn't
  // limited by an eventLimit collapse boundary, since nothing is folded
  // back through, the ledger is emptied outright. See sacredReset.
  reset: () => void
  // Pops the last `steps` events (default 1) and recomputes the value.
  // Cannot revert past an eventLimit collapse boundary. See sacredRevert.
  revert: (steps?: number) => void
  unset: (key: number | string, options?: SacredUnsetOptions) => void
  // Three call signatures. Whole-value upserts (no key) must match T at
  // compile time; keyed upserts target a nested slice of T, which isn't
  // practically type-checkable against a string path, so value stays
  // loose there. `replace` is available on the whole-value and
  // string-keyed forms, since a string key still names one full value
  // to replace, just at a path instead of at the root. It's dropped
  // from the numeric-keyed (array index) form, since that already
  // replaces the targeted index outright with no merge to opt out of.
  upsert: {
    (value: T, options?: Omit<SacredUpsertOptions, 'key'>): void
    (
      value: any,
      options: Omit<SacredUpsertOptions, 'key'> & { key: string },
    ): void
    (
      value: any,
      options: Omit<SacredUpsertOptions, 'key' | 'replace'> & { key: number },
    ): void
  }
}

// Returned instead of Sacred<T> when { aggregate: false } is passed to
// sacred()/sacredState(). unset() and keyed upsert() both rely on
// folding to make sense of a partial event, and neither is well-defined
// when getValue() just returns the latest event verbatim, so both are
// dropped from the type here. A runtime call to either is also rejected
// (see filterAggregateSupported in event.ts) in case the value escapes
// this narrower type, e.g. via an `any` cast.
//
// Internally this is sugar over the more general per-event `replace`
// upsert option (see SacredUpsertOptions): a non-aggregating sacred
// just stamps every whole-value upsert's event with replace: true
// automatically, rather than being a separate mechanism.
export type SacredNoAggregate<T> = Omit<Sacred<T>, 'unset' | 'upsert'> & {
  upsert: (value: T, options?: Omit<SacredUpsertOptions, 'key'>) => void
}

// true/false gives reference-equality deduping (the default). Pass a
// comparator when you need real dedupe for object/array values, since
// reference equality almost never matches there.
export type SacredChangeOnly =
  | boolean
  | ((previousValue: any, nextValue: any) => boolean)

export type SacredAsyncStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected'

// data/error are explicit null rather than undefined so a transition
// actually clears the previous one. Object upserts merge by key, and an
// undefined value is treated as "no change" (see objectMerge), so only
// an explicit null overwrites it.
export type SacredAsyncState<D> = {
  status: SacredAsyncStatus
  data: D | null
  error: unknown | null
}

export type SacredAsyncOptions = SacredInput

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
    // Whether this specific write replaced the aggregate outright
    // instead of merging onto it. See SacredUpsertOptions.replace.
    replace?: boolean
    signature?: string
    upsertKey?: number | string
  }
  type: string
  value: T
}

export type SacredEventAdd = SacredEventChange & {
  changeOnly?: SacredChangeOnly
  checkType?: boolean
  debug?: boolean
  events: SacredEvent[]
  key?: number | string
  options: SacredOptions
  originalValue: any
  replace?: boolean
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

export type SacredEventUpsert = SacredEventChange & {
  key?: number | string
  replace?: boolean
  value: any
}

export type SacredInput = {
  // Whether object/array sacreds fold their event history into a merged
  // value (default true). Set to false to make getValue() return the
  // latest event's value verbatim instead of merging it onto the
  // previous one. See SacredNoAggregate. Ignored for primitive
  // sacreds, which never fold in the first place.
  aggregate?: boolean
  changeOnly?: SacredChangeOnly
  debug?: boolean
  // Caps how many events accumulate before older ones are collapsed into
  // one aggregate. Defaults to 1000 so writes to object/array sacreds stay
  // cheap without you having to think about it. Pass 0 for unlimited.
  eventLimit?: number
  events?: SacredEvent[]
  sideEffect?: ObservableEffect[]
  triggerOnCreate?: boolean
}

export type SacredMergeOptions = SacredInput

// Maps a tuple of sacreds to a tuple of their value types, positionally,
// e.g. [Sacred<string>, Sacred<number>] -> [string, number].
export type SacredMergeValues<T extends readonly Sacred<any>[]> = {
  [K in keyof T]: T[K] extends Sacred<infer V> ? V : never
}

export type SacredOptions = {
  aggregate?: boolean
  eventLimit?: number
}

export type SacredPassedIn = {
  changeOnly?: SacredChangeOnly
  debug?: boolean
  events: SacredEvent[]
  observableValue?: Observable
  options?: SacredOptions
  originalValue: any
}

export type SacredSelectOptions<S> = {
  isEqual?: (previousValue: S, nextValue: S) => boolean
}

export type SacredSerialized<T> = {
  value: T
  events: SacredEvent[]
}

export type SacredUnsetOptions = {
  signature?: any
}

export type SacredUpsertOptions = {
  key?: number | string
  // Replace the value outright instead of merging onto it: the whole
  // value on a whole-value upsert, or just the value at `key` on a
  // string-keyed one. See the "Sacred Aggregate Option" section of the
  // README. Not available on a numeric-keyed (array index) upsert,
  // which already replaces that index outright (see
  // filterReplaceSupported in event.ts).
  replace?: boolean
  signature?: any
}
