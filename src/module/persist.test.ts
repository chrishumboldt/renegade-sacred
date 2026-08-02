import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'
import { sacredHydrate, sacredSerialize } from './persist'

test('Test that sacredSerialize/sacredHydrate round-trips through JSON with the same value.', () => {
  const original = sacred<any>({ value: { name: 'Ani', attributes: { age: 9 } } })

  original.upsert({ key: 'name', value: 'Darth Vader' })
  original.upsert({ key: 'attributes.age', value: 41 })

  const json = JSON.parse(JSON.stringify(sacredSerialize(original)))
  const hydrated = sacredHydrate(json)

  assert.deepStrictEqual(hydrated.getValue(), original.getValue())
  assert.deepStrictEqual(hydrated.getOriginalValue(), original.getOriginalValue())
  assert.strictEqual(hydrated.getEvents().length, original.getEvents().length)
})

test('Test that a hydrated sacred continues to accept writes identically to the original.', () => {
  const original = sacred<any>({ value: { count: 0 } })
  original.upsert({ key: 'count', value: 1 })

  const hydrated = sacredHydrate(sacredSerialize(original))
  hydrated.upsert({ key: 'count', value: 2 })

  assert.deepStrictEqual(hydrated.getValue(), { count: 2 })
  // The original is untouched by writes made after serialization.
  assert.deepStrictEqual(original.getValue(), { count: 1 })
})

test('Test that sacredSerialize defensively copies the event array.', () => {
  const original = sacred<any>({ value: { count: 0 } })
  original.upsert({ key: 'count', value: 1 })

  const serialized = sacredSerialize(original)
  original.upsert({ key: 'count', value: 2 })

  assert.strictEqual(serialized.events.length, 1)
})

test('Test that hydrate forwards options (e.g. eventLimit) and collapse continues correctly after hydration.', () => {
  const original = sacred<any>({ value: { count: 0 }, eventLimit: 2 })
  original.upsert({ key: 'count', value: 1 })
  original.upsert({ key: 'count', value: 2 })

  const hydrated = sacredHydrate(sacredSerialize(original), { eventLimit: 2 })
  hydrated.upsert({ key: 'count', value: 3 })
  hydrated.upsert({ key: 'count', value: 4 })

  assert.deepStrictEqual(hydrated.getValue(), { count: 4 })
  assert.ok(hydrated.getEvents().length <= 2)
})
