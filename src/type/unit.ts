export interface Unit<I> {
  chain: UnitChain<I>
  error?: string[]
  flatten: () => I
  map: UnitMap<I>
  type: 'left' | 'right'
}

export type UnitChain<I> = <O>(func: (input: I) => O) => O

export type UnitFilterFuncResult = UnitFilterResult | boolean

export interface UnitFilterResult {
  error?: string[]
  validity: boolean
}

export type UnitFunctor = <I>(input: I) => Unit<I>

export type UnitMap<I> = <O>(func: (input: I) => O) => Unit<O>

export interface UnitMapEither<I, O> {
  condition: (input: I) => boolean
  left?: (input: I) => O
  right: (input: I) => O
}

export interface UnitTask<I> {
  (): Promise<I>
}

