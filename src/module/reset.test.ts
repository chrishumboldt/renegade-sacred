import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

test('Test that reset() clears the event history and returns to the original value.', () => {
  const sacredThing = sacred<any>({ age: 9 })

  sacredThing.upsert(10, { key: 'age' })
  sacredThing.upsert(11, { key: 'age' })
  sacredThing.reset()

  assert.deepStrictEqual(sacredThing.getValue(), { age: 9 })
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that reset() on a sacred with no events is a safe no-op.', () => {
  const sacredThing = sacred<any>({ age: 9 })

  sacredThing.reset()

  assert.deepStrictEqual(sacredThing.getValue(), { age: 9 })
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that reset() notifies observers with the original value.', () => {
  const sacredThing = sacred<any>({ age: 9 })
  const seen: number[] = []

  sacredThing.observe(({ value }) => seen.push(value.age), false)
  sacredThing.upsert(10, { key: 'age' })
  sacredThing.reset()

  assert.deepStrictEqual(seen, [10, 9])
})

test('Test that reset() recovers a state that revert() could not, past an eventLimit collapse.', () => {
  const sacredThing = sacred<any>({ age: 9 }, { eventLimit: 2 })

  sacredThing.upsert(10, { key: 'age' })
  sacredThing.upsert(11, { key: 'age' })
  sacredThing.upsert(12, { key: 'age' })
  // The oldest events have already been folded into one synthetic
  // aggregate, so the original age:9 is no longer a revertible step.

  sacredThing.reset()

  assert.deepStrictEqual(sacredThing.getValue(), { age: 9 })
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that writes after reset() behave normally.', () => {
  const sacredThing = sacred<any>({ age: 9, name: 'Ani' })

  sacredThing.upsert(41, { key: 'age' })
  sacredThing.reset()
  sacredThing.upsert(10, { key: 'age' })

  assert.deepStrictEqual(sacredThing.getValue(), { age: 10, name: 'Ani' })
})

test('Test that reset() does not mutate the original value.', () => {
  const sacredThing = sacred<any>({ age: 9, name: 'Ani' })

  sacredThing.upsert(41, { key: 'age' })
  sacredThing.reset()
  sacredThing.upsert(10, { key: 'age' })

  assert.deepStrictEqual(sacredThing.getOriginalValue(), {
    age: 9,
    name: 'Ani',
  })
})

test('Test that reset() works on a primitive sacred.', () => {
  const sacredNumber = sacred(1)

  sacredNumber.upsert(2)
  sacredNumber.upsert(3)
  sacredNumber.reset()

  assert.strictEqual(sacredNumber.getValue(), 1)
  assert.strictEqual(sacredNumber.getEvents().length, 0)
})
