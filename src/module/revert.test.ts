import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

test('Test that revert() with no argument undoes the single latest event.', () => {
  const sacredThing = sacred<any>({ age: 9 })

  sacredThing.upsert(10, { key: 'age' })
  sacredThing.upsert(11, { key: 'age' })
  sacredThing.revert()

  assert.strictEqual(sacredThing.getValue().age, 10)
  assert.strictEqual(sacredThing.getEvents().length, 1)
})

test('Test that revert(steps) undoes multiple events at once.', () => {
  const sacredThing = sacred<any>({ age: 9 })

  sacredThing.upsert(10, { key: 'age' })
  sacredThing.upsert(11, { key: 'age' })
  sacredThing.revert(2)

  assert.strictEqual(sacredThing.getValue().age, 9)
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that revert(steps) larger than the event history clamps safely instead of throwing.', () => {
  const sacredThing = sacred<any>({ age: 9 })

  sacredThing.upsert(10, { key: 'age' })
  sacredThing.revert(100)

  assert.strictEqual(sacredThing.getValue().age, 9)
  assert.strictEqual(sacredThing.getEvents().length, 0)
})

test('Test that revert(0) and a negative steps count are no-ops.', () => {
  const sacredThing = sacred<any>({ age: 9 })

  sacredThing.upsert(10, { key: 'age' })
  sacredThing.revert(0)
  sacredThing.revert(-1)

  assert.strictEqual(sacredThing.getValue().age, 10)
  assert.strictEqual(sacredThing.getEvents().length, 1)
})

test('Test that revert() notifies observers with the reverted value.', () => {
  const sacredThing = sacred<any>({ age: 9 })
  const seen: number[] = []

  sacredThing.observe(({ value }) => seen.push(value.age), false)
  sacredThing.upsert(10, { key: 'age' })
  sacredThing.revert()

  assert.deepStrictEqual(seen, [10, 9])
})

test('Test that revert() cannot recover an intermediate state lost to an eventLimit collapse.', () => {
  const sacredThing = sacred<any>({ age: 9 }, { eventLimit: 2 })

  sacredThing.upsert(10, { key: 'age' })
  sacredThing.upsert(11, { key: 'age' })
  sacredThing.upsert(12, { key: 'age' })
  // age:9 -> 10 -> 11 has now been folded into one synthetic event
  // (aggregate age:11), so age:10 can no longer be reverted to on its own.

  sacredThing.revert()
  assert.strictEqual(sacredThing.getValue().age, 11)

  sacredThing.revert()
  // Jumps straight to the original value, since age:10 no longer exists
  // as a distinct, revertible step.
  assert.strictEqual(sacredThing.getValue().age, 9)
})
