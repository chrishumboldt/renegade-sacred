export interface Observable {
  getObserverCount: () => number
  getValue: () => any
  observe: (effect: ObservableEffect, triggerOnObserve?: boolean) => Observer
  upsert: (newValue: any) => void
}

export interface ObservableInput {
  sideEffect?: ObservableEffect[]
  triggerOnCreate?: boolean
  value: any
}

export type ObservableEffect = (input: any) => void

export interface Observer {
  getObserverId: () => string
  unobserve: () => void
}

export type ObservableEffectMerge = (input: any[]) => void
