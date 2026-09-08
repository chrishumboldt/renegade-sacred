export function pipe<A>(input: A): A
export function pipe<A, B>(input: A, b: (a: A) => B): B
export function pipe<A, B, C>(input: A, b: (a: A) => B, c: (b: B) => C): C
export function pipe<A, B, C, D>(
  input: A,
  b: (a: A) => B,
  c: (b: B) => C,
  d: (c: C) => D,
): D
export function pipe<A, B, C, D, E>(
  input: A,
  b: (a: A) => B,
  c: (b: B) => C,
  d: (c: C) => D,
  e: (d: D) => E,
): E
export function pipe<A, B, C, D, E, F>(
  input: A,
  b: (a: A) => B,
  c: (b: B) => C,
  d: (c: C) => D,
  e: (d: D) => E,
  f: (e: E) => F,
): F
export function pipe<A, B, C, D, E, F, G>(
  input: A,
  b: (a: A) => B,
  c: (b: B) => C,
  d: (c: C) => D,
  e: (d: D) => E,
  f: (e: E) => F,
  g: (f: F) => G,
): G
export function pipe(
  input: unknown,
  ...funcs: ((input: unknown) => unknown)[]
) {
  return funcs.reduce((chain, func) => func(chain), input)
}

export function map<I, O>(func: (input: I) => O) {
  return (input: I): O => func(input)
}

// Run a side effect and pass the original value through unchanged.
export function tap<I>(func: (input: I) => void) {
  return (input: I): I => {
    func(input)

    return input
  }
}
