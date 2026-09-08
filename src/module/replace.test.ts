import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'
import { sacredHydrate, sacredSerialize } from './persist'

test('Test that a whole-value upsert with replace: true swaps the aggregate instead of merging.', () => {
  const sacredThing = sacred<any>({ a: 1, b: 2 })

  sacredThing.upsert({ c: 3 }, { replace: true })

  assert.deepStrictEqual(sacredThing.getValue(), { c: 3 })
})

test('Test that a whole-value upsert without replace still merges.', () => {
  const sacredThing = sacred<any>({ a: 1, b: 2 })

  sacredThing.upsert({ c: 3 })

  assert.deepStrictEqual(sacredThing.getValue(), { a: 1, b: 2, c: 3 })
})

test('Test that a string-keyed upsert with replace: true swaps the value at that key.', () => {
  const sacredThing = sacred<any>({ user: { a: 1, b: 2 }, other: true })

  sacredThing.upsert({ c: 3 }, { key: 'user', replace: true })

  assert.deepStrictEqual(sacredThing.getValue(), {
    user: { c: 3 },
    other: true,
  })
})

test('Test that a string-keyed upsert without replace merges into the nested value.', () => {
  const sacredThing = sacred<any>({ user: { a: 1, b: 2 }, other: true })

  sacredThing.upsert({ c: 3 }, { key: 'user' })

  assert.deepStrictEqual(sacredThing.getValue(), {
    user: { a: 1, b: 2, c: 3 },
    other: true,
  })
})

test('Test that the replace flag is recorded on the event metadata.', () => {
  const sacredThing = sacred<any>({ a: 1 })

  sacredThing.upsert({ b: 2 }, { replace: true })

  assert.strictEqual(sacredThing.getEvents()[0].metadata?.replace, true)
})

test('Test that an ordinary upsert leaves no replace flag on the event metadata.', () => {
  const sacredThing = sacred<any>({ a: 1 })

  sacredThing.upsert({ b: 2 })

  assert.strictEqual(sacredThing.getEvents()[0].metadata?.replace, undefined)
})

test('Test that a number-keyed upsert with replace: true is rejected with a warning and is a no-op.', () => {
  const sacredThing = sacred<string[]>(['a', 'b', 'c'])
  const originalWarn = console.warn
  let warned = false

  console.warn = () => {
    warned = true
  }

  try {
    sacredThing.upsert('z' as any, { key: 0, replace: true } as any)
  } finally {
    console.warn = originalWarn
  }

  assert.strictEqual(warned, true)
  assert.deepStrictEqual(sacredThing.getValue(), ['a', 'b', 'c'])
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that a whole-value replace survives a serialize/hydrate round-trip (full refold).', () => {
  const original = sacred<any>({ a: 1, b: 2 })
  original.upsert({ c: 3 }, { replace: true })

  const hydrated = sacredHydrate(
    JSON.parse(JSON.stringify(sacredSerialize(original))),
  )

  assert.deepStrictEqual(hydrated.getValue(), { c: 3 })
})

test('Test that a string-keyed replace survives a serialize/hydrate round-trip (full refold).', () => {
  const original = sacred<any>({ user: { a: 1, b: 2 }, other: true })
  original.upsert({ c: 3 }, { key: 'user', replace: true })

  const hydrated = sacredHydrate(
    JSON.parse(JSON.stringify(sacredSerialize(original))),
  )

  assert.deepStrictEqual(hydrated.getValue(), {
    user: { c: 3 },
    other: true,
  })
})

test('Test that a replace survives collapseEvents().', () => {
  const sacredThing = sacred<any>({ a: 1, b: 2 })

  sacredThing.upsert({ c: 3 }, { replace: true })
  sacredThing.upsert(4, { key: 'd' })
  sacredThing.collapseEvents()

  assert.strictEqual(sacredThing.getEvents().length, 1)
  assert.deepStrictEqual(sacredThing.getValue(), { c: 3, d: 4 })
})

test('Test that a normal merge after a replace builds on the replaced value.', () => {
  const sacredThing = sacred<any>({ a: 1, b: 2 })

  sacredThing.upsert({ c: 3 }, { replace: true })
  sacredThing.upsert(4, { key: 'd' })

  assert.deepStrictEqual(sacredThing.getValue(), { c: 3, d: 4 })
})

test('Test that a replace write does not mutate an earlier getValue() snapshot.', () => {
  const sacredThing = sacred<any>({ user: { a: 1, b: 2 }, other: true })
  const before = sacredThing.getValue()

  sacredThing.upsert({ c: 3 }, { key: 'user', replace: true })

  assert.deepStrictEqual(before, { user: { a: 1, b: 2 }, other: true })
})
