export type Observable = {
  getObserverCount: () => number
  getValue: () => any
  observe: (effect: ObservableEffect, triggerOnObserve?: boolean) => Observer
  upsert: (newValue: any) => void
}

export type ObservableInput = {
  sideEffect?: ObservableEffect[]
  triggerOnCreate?: boolean
  value: any
}

export type ObservableEffect = (input: any) => void

export type Observer = {
  getObserverId: () => string
  unobserve: () => void
}
