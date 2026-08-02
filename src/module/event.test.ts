import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

test('Test that upserting a mismatched type is rejected and logs a warning.', () => {
  const sacredNumber = sacred({ value: 1 })
  const originalWarn = console.warn
  let warned = false

  console.warn = () => {
    warned = true
  }

  try {
    sacredNumber.upsert({ value: 'two' as any })
  } finally {
    console.warn = originalWarn
  }

  assert.strictEqual(warned, true)
  assert.strictEqual(sacredNumber.getValue(), 1)
  assert.strictEqual(sacredNumber.getEvents().length, 0)
})

test('Test that upserting the correct type is accepted.', () => {
  const sacredNumber = sacred({ value: 1 })

  sacredNumber.upsert({ value: 2 })

  assert.strictEqual(sacredNumber.getValue(), 2)
})

test('Test that a key-based upsert bypasses the root type check.', () => {
  const sacredThing = sacred<any>({ value: { age: 9 } })

  sacredThing.upsert({ key: 'age', value: 'nine' })

  assert.strictEqual(sacredThing.getValue().age, 'nine')
})
