import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

test('Test that a fresh { aggregate: false } sacred reports the original value.', () => {
  const sacredThing = sacred<any>({ a: 1 }, { aggregate: false })

  assert.deepStrictEqual(sacredThing.getValue(), { a: 1 })
})

test('Test that { aggregate: false } replaces the whole object instead of merging.', () => {
  const sacredThing = sacred<any>({ a: 1, b: 2 }, { aggregate: false })

  sacredThing.upsert({ c: 3 })

  assert.deepStrictEqual(sacredThing.getValue(), { c: 3 })
})

test('Test that { aggregate: false } replaces an array instead of concatenating.', () => {
  const sacredThing = sacred<number[]>([1, 2, 3], { aggregate: false })

  sacredThing.upsert([4, 5])

  assert.deepStrictEqual(sacredThing.getValue(), [4, 5])
})

test('Test that { aggregate: false } keeps returning the latest value verbatim across writes.', () => {
  const sacredThing = sacred<any>({ step: 0 }, { aggregate: false })

  sacredThing.upsert({ step: 1 })
  sacredThing.upsert({ step: 2, extra: true })

  assert.deepStrictEqual(sacredThing.getValue(), { step: 2, extra: true })
})

test('Test that { aggregate: false } stores each event value verbatim and flags it as a replace.', () => {
  const sacredThing = sacred<any>({ a: 1 }, { aggregate: false })

  sacredThing.upsert({ b: 2 })

  const [event] = sacredThing.getEvents()
  assert.deepStrictEqual(event.value, { b: 2 })
  assert.strictEqual(event.metadata?.replace, true)
})

test('Test that getOptions() reflects aggregate: false.', () => {
  const sacredThing = sacred<any>({ a: 1 }, { aggregate: false })

  assert.strictEqual(sacredThing.getOptions().aggregate, false)
})

test('Test that aggregate defaults to true and still merges object writes.', () => {
  const sacredThing = sacred<any>({ a: 1, b: 2 })

  sacredThing.upsert({ c: 3 })

  assert.deepStrictEqual(sacredThing.getValue(), { a: 1, b: 2, c: 3 })
  assert.strictEqual(sacredThing.getOptions().aggregate, true)
})

test('Test that revert() on an { aggregate: false } sacred steps back to the previous value.', () => {
  const sacredThing = sacred<any>({ n: 0 }, { aggregate: false })

  sacredThing.upsert({ n: 1 })
  sacredThing.upsert({ n: 2 })
  sacredThing.revert()

  assert.deepStrictEqual(sacredThing.getValue(), { n: 1 })
})

test('Test that reverting every event on an { aggregate: false } sacred returns the original value.', () => {
  const sacredThing = sacred<any>({ n: 0 }, { aggregate: false })

  sacredThing.upsert({ n: 1 })
  sacredThing.upsert({ n: 2 })
  sacredThing.revert(2)

  assert.deepStrictEqual(sacredThing.getValue(), { n: 0 })
})

test('Test that unset() on an { aggregate: false } sacred is rejected with a warning and is a no-op.', () => {
  const sacredThing = sacred<any>({ a: 1 }, { aggregate: false })
  const originalWarn = console.warn
  let warned = false

  console.warn = () => {
    warned = true
  }

  try {
    // unset() is intentionally absent from SacredNoAggregate, so reach it
    // through the wider type to prove the runtime guard also holds.
    ;(sacredThing as unknown as { unset: (key: string) => void }).unset('a')
  } finally {
    console.warn = originalWarn
  }

  assert.strictEqual(warned, true)
  assert.deepStrictEqual(sacredThing.getValue(), { a: 1 })
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that a keyed upsert() on an { aggregate: false } sacred is rejected with a warning and is a no-op.', () => {
  const sacredThing = sacred<any>({ a: 1 }, { aggregate: false })
  const originalWarn = console.warn
  let warned = false

  console.warn = () => {
    warned = true
  }

  try {
    ;(
      sacredThing as unknown as {
        upsert: (value: any, options: { key: string }) => void
      }
    ).upsert(2, { key: 'a' })
  } finally {
    console.warn = originalWarn
  }

  assert.strictEqual(warned, true)
  assert.deepStrictEqual(sacredThing.getValue(), { a: 1 })
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that { aggregate: false } is harmless on a primitive sacred.', () => {
  const sacredNumber = sacred(1, { aggregate: false })

  sacredNumber.upsert(2)
  sacredNumber.upsert(3)

  assert.strictEqual(sacredNumber.getValue(), 3)
})

test('Test that observers of an { aggregate: false } sacred see each replaced value.', () => {
  const sacredThing = sacred<any>({ n: 0 }, { aggregate: false })
  const seen: number[] = []

  sacredThing.observe(({ value }) => seen.push(value.n), false)
  sacredThing.upsert({ n: 1 })
  sacredThing.upsert({ n: 2 })

  assert.deepStrictEqual(seen, [1, 2])
})
