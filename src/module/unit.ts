import type {
  Unit,
  UnitFilterFuncResult,
  UnitFunctor,
  UnitMapEither,
} from '../type'

// A generic unit.
// If we declare a single generic unit (Functor) we can pass this unit
// through a pipe. Once it is in the pipe we can unpack it and do
// things we could not normally do in a pipe composition.
export function unit<I>(input: I): Unit<I> {
  return {
    chain: (func: any) => func(input),
    flatten: () => input,
    map: (func: any) => unit(func(input)),
    type: 'right',
  }
}

// The left functor is a unit that knows it has "failed" and prevents the
// execution of a function on the value. All it does is continue to
// return the value back.
export function left<I>(input: I): Unit<I> {
  const leftUnit = unit(input)

  leftUnit.chain = <O>() => left(input) as O
  leftUnit.map = <O>() => left(input) as O
  leftUnit.type = 'left'

  return leftUnit
}

// The right functor is just a unit that is guaranteed to be correct.
export const right: UnitFunctor = unit

// Operators.
export function filter<I>(func: (input: I) => UnitFilterFuncResult) {
  return (unit: Unit<I>): Unit<I> => {
    const filterResult: UnitFilterFuncResult = unit.chain(func)

    if (filterResult === false) {
      const leftUnit = left(unit.flatten())

      leftUnit.error = ['A filter in the pipe did not pass.']

      return leftUnit
    }

    if (typeof filterResult === 'object' && filterResult.validity === false) {
      const leftUnit = left(unit.flatten())

      leftUnit.error = filterResult.error

      return leftUnit
    }

    return unit
  }
}

export function log<I>(prefix?: string, stringify?: boolean) {
  return (unit: Unit<I>): Unit<I> => {
    logRun(unit, prefix, stringify, unit.type === 'right')

    return unit
  }
}

export function logForce<I>(prefix?: string, stringify?: boolean) {
  return (unit: Unit<I>): Unit<I> => {
    logRun(unit, prefix, stringify, true)

    return unit
  }
}

function logRun(
  unit: Unit<any>,
  prefix = 'LOG',
  stringify = true,
  force = false,
) {
  if (force === true) {
    const value = unit.flatten()
    console.log(
      `[${prefix.toUpperCase()}]:`,
      stringify ? JSON.stringify(value) : value,
    )
  }
}

export function map<I, O>(func: (input: I) => O) {
  return (unit: Unit<I>): Unit<O> => {
    return unit.type === 'right' ? unit.map(func) : (unit as unknown as Unit<O>)
  }
}

export function mapEither<I, O>({
  condition,
  left: leftFunc,
  right: rightFunc,
}: UnitMapEither<I, O>) {
  return (unit: Unit<I>): Unit<O> | Unit<I> => {
    if (unit.chain(condition) === true) {
      return unit.map(rightFunc)
    }

    // Fallback to the left functor if nothing is provided.
    return leftFunc ? unit.map(leftFunc) : left(unit.flatten())
  }
}

// If the unit is in a left state then short circuit by returning the unit
// as is. We overwrite the type to make sure Typescript is still happy.
export function merge<I, O>(func: (input: I) => O) {
  return (unit: Unit<I>): O | Unit<I> => {
    return unit.type === 'right' ? unit.chain(func) : unit
  }
}

export function tap<I>(func: (input: I) => void) {
  return (unit: Unit<I>): Unit<I> => {
    if (unit.type === 'right') {
      unit.chain(func)
    }

    return unit
  }
}
