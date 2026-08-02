import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacredMerge } from './merge'
import { sacred } from './sacred'

test('Test that a merge aggregates the initial values of each sacred.', () => {
  const sacredOne = sacred({ value: 'Ani' })
  const sacredTwo = sacred({ value: 9 })
  const merged = sacredMerge([sacredOne, sacredTwo])
  const seen: unknown[] = []

  merged.observe(value => {
    seen.push(value)
  })

  assert.deepStrictEqual(seen[0], ['Ani', 9])
})

test('Test that a merge reacts when one of the sacreds changes.', () => {
  const sacredOne = sacred({ value: 'Ani' })
  const sacredTwo = sacred({ value: 9 })
  const merged = sacredMerge([sacredOne, sacredTwo])
  const seen: unknown[] = []

  merged.observe(value => {
    seen.push(value)
  })

  sacredOne.upsert({ value: 'Darth Vader' })

  assert.deepStrictEqual(seen[seen.length - 1], ['Darth Vader', 9])
})

test('Test that triggerOnObserve false does not immediately call the effect.', () => {
  const sacredOne = sacred({ value: 'Ani' })
  const merged = sacredMerge([sacredOne])
  let calls = 0

  merged.observe(() => {
    calls += 1
  }, false)

  assert.strictEqual(calls, 0)

  sacredOne.upsert({ value: 'Darth Vader' })

  assert.strictEqual(calls, 1)
})

test('Test that unobserving a merge releases the underlying observers.', () => {
  const sacredOne = sacred({ value: 'Ani' })
  const sacredTwo = sacred({ value: 9 })
  const merged = sacredMerge([sacredOne, sacredTwo])

  assert.strictEqual(sacredOne.getObserverCount(), 1)
  assert.strictEqual(sacredTwo.getObserverCount(), 1)

  const observer = merged.observe(() => {})
  observer.unobserve()

  assert.strictEqual(sacredOne.getObserverCount(), 0)
  assert.strictEqual(sacredTwo.getObserverCount(), 0)
})

test('Test that a merge supports multiple independent subscribers.', () => {
  const sacredOne = sacred({ value: 1 })
  const merged = sacredMerge([sacredOne])
  const seenByOne: unknown[] = []
  const seenByTwo: unknown[] = []

  merged.observe(value => seenByOne.push(value))
  merged.observe(value => seenByTwo.push(value))

  sacredOne.upsert({ value: 2 })

  assert.deepStrictEqual(seenByOne, [[1], [2]])
  assert.deepStrictEqual(seenByTwo, [[1], [2]])
})

test('Test that unobserving one subscriber does not affect another.', () => {
  const sacredOne = sacred({ value: 1 })
  const merged = sacredMerge([sacredOne])
  const seenByOne: unknown[] = []
  const seenByTwo: unknown[] = []

  const subscriberOne = merged.observe(value => seenByOne.push(value))
  merged.observe(value => seenByTwo.push(value))

  subscriberOne.unobserve()
  sacredOne.upsert({ value: 2 })

  assert.deepStrictEqual(seenByOne, [[1]])
  assert.deepStrictEqual(seenByTwo, [[1], [2]])
})

test('Test that sacredMerge forwards options to the internal result sacred.', () => {
  const sacredOne = sacred({ value: 'Ani' })
  const originalDebug = console.debug
  let debugCalls = 0

  console.debug = () => {
    debugCalls += 1
  }

  try {
    sacredMerge([sacredOne], { debug: true })
  } finally {
    console.debug = originalDebug
  }

  assert.ok(debugCalls > 0)
})
