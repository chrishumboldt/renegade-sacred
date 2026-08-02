import assert from 'node:assert/strict'
import { test } from 'node:test'
import { map, pipe, tap } from './pipe'

test('Test that pipe threads a value through each function in order.', () => {
  const addOne = (n: number) => n + 1
  const double = (n: number) => n * 2
  const toString = (n: number) => `value:${n}`

  const result = pipe(3, addOne, double, toString)

  assert.strictEqual(result, 'value:8')
})

test('Test that pipe with no functions returns the input unchanged.', () => {
  const result = pipe(42)

  assert.strictEqual(result, 42)
})

test('Test that pipe with a single function applies just that function.', () => {
  const result = pipe(4, (n: number) => n * 10)

  assert.strictEqual(result, 40)
})

test('Test that map transforms the value it is given.', () => {
  const result = pipe(
    3,
    map((n: number) => n + 1),
  )

  assert.strictEqual(result, 4)
})

test('Test that tap runs a side effect and passes the original value through.', () => {
  let seen: number | undefined

  const result = pipe(
    3,
    tap((n: number) => {
      seen = n
    }),
  )

  assert.strictEqual(seen, 3)
  assert.strictEqual(result, 3)
})

test('Test that a mutation inside tap is visible to the rest of the pipe.', () => {
  const result = pipe(
    { count: 1 },
    tap(value => {
      value.count = 99
    }),
    value => value.count,
  )

  assert.strictEqual(result, 99)
})
