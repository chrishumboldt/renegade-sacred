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

test('Test that upserting an array over an object root is rejected even though both are typeof "object".', () => {
  const sacredThing = sacred<any>({ value: { age: 9 } })
  const originalWarn = console.warn
  let warned = false

  console.warn = () => {
    warned = true
  }

  try {
    sacredThing.upsert({ value: [1, 2, 3] })
  } finally {
    console.warn = originalWarn
  }

  assert.strictEqual(warned, true)
  assert.deepStrictEqual(sacredThing.getValue(), { age: 9 })
})

test('Test that upserting an object over an array root is rejected even though both are typeof "object".', () => {
  const sacredThing = sacred<any>({ value: [1, 2, 3] })
  const originalWarn = console.warn
  let warned = false

  console.warn = () => {
    warned = true
  }

  try {
    sacredThing.upsert({ value: { age: 9 } })
  } finally {
    console.warn = originalWarn
  }

  assert.strictEqual(warned, true)
  assert.deepStrictEqual(sacredThing.getValue(), [1, 2, 3])
})

test('Test that upserting null over an object root is rejected even though both are typeof "object".', () => {
  const sacredThing = sacred<any>({ value: { age: 9 } })
  const originalWarn = console.warn
  let warned = false

  console.warn = () => {
    warned = true
  }

  try {
    sacredThing.upsert({ value: null })
  } finally {
    console.warn = originalWarn
  }

  assert.strictEqual(warned, true)
  assert.deepStrictEqual(sacredThing.getValue(), { age: 9 })
})

test('Test that a root sacred value of null is preserved rather than coerced to an object.', () => {
  const sacredThing = sacred<any>({ value: null })

  assert.strictEqual(sacredThing.getValue(), null)
})

test('Test that a key-based upsert can set a nested property to explicit null.', () => {
  const sacredThing = sacred<any>({ value: { age: 9 } })

  sacredThing.upsert({ key: 'age', value: null })

  assert.deepStrictEqual(sacredThing.getValue(), { age: null })
})

test('Test that changeOnly with no comparator does not dedupe object upserts (reference equality only).', () => {
  const sacredThing = sacred<any>({ value: { id: 1 }, changeOnly: true })

  sacredThing.upsert({ value: { id: 1 } })
  sacredThing.upsert({ value: { id: 1 } })

  assert.strictEqual(sacredThing.getEvents().length, 2)
})

test('Test that changeOnly accepts a custom comparator to dedupe object upserts.', () => {
  const sacredThing = sacred<any>({
    value: { id: 1 },
    changeOnly: (previous, next) => previous?.id === next?.id,
  })

  sacredThing.upsert({ value: { id: 1 } })
  sacredThing.upsert({ value: { id: 1 } })

  assert.strictEqual(sacredThing.getEvents().length, 1)

  sacredThing.upsert({ value: { id: 2 } })

  assert.strictEqual(sacredThing.getEvents().length, 2)
})
