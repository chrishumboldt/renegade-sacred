import assert from 'node:assert/strict'
import { test } from 'node:test'
import { observable } from './observable'
import { sacred } from './sacred'

test('Test that a side effect is registered but not run unless triggerOnCreate is set.', () => {
  let calls = 0

  observable({
    value: 1,
    sideEffect: [
      () => {
        calls += 1
      },
    ],
  })

  assert.strictEqual(calls, 0)
})

test('Test that triggerOnCreate runs side effects immediately.', () => {
  let received: any

  observable({
    value: 1,
    sideEffect: [(value: any) => (received = value)],
    triggerOnCreate: true,
  })

  assert.strictEqual(received, 1)
})

test('Test that observe runs immediately by default and receives updates.', () => {
  const seen: any[] = []
  const observableValue = observable({ value: 'Ani' })

  observableValue.observe((value: any) => seen.push(value))

  assert.deepStrictEqual(seen, ['Ani'])

  observableValue.upsert('Darth Vader')

  assert.deepStrictEqual(seen, ['Ani', 'Darth Vader'])
})

test('Test that observe with triggerOnObserve false waits for the next change.', () => {
  const seen: any[] = []
  const observableValue = observable({ value: 'Ani' })

  observableValue.observe((value: any) => seen.push(value), false)

  assert.deepStrictEqual(seen, [])

  observableValue.upsert('Darth Vader')

  assert.deepStrictEqual(seen, ['Darth Vader'])
})

test('Test that unobserve stops future notifications and updates the observer count.', () => {
  const observableValue = observable({ value: 1 })
  const observer = observableValue.observe(() => {})

  assert.strictEqual(observableValue.getObserverCount(), 1)

  observer.unobserve()

  assert.strictEqual(observableValue.getObserverCount(), 0)
})

test('Test that a throwing observer does not stop other observers from being notified.', () => {
  const seen: any[] = []
  const observableValue = observable({ value: 1 })
  const originalWarn = console.warn

  console.warn = () => {}

  observableValue.observe(() => {
    throw new Error('boom')
  }, false)
  observableValue.observe((value: any) => seen.push(value), false)

  try {
    observableValue.upsert(2)
  } finally {
    console.warn = originalWarn
  }

  assert.deepStrictEqual(seen, [2])
})

test('Test that a throwing sideEffect at triggerOnCreate does not stop the rest.', () => {
  const seen: any[] = []
  const originalWarn = console.warn

  console.warn = () => {}

  try {
    observable({
      value: 1,
      triggerOnCreate: true,
      sideEffect: [
        () => {
          throw new Error('boom')
        },
        (value: any) => seen.push(value),
      ],
    })
  } finally {
    console.warn = originalWarn
  }

  assert.deepStrictEqual(seen, [1])
})

test('Test that sacred() observe fires when the sacred is upserted.', () => {
  const sacredThing = sacred('Ani')
  const seen: string[] = []

  sacredThing.observe(({ value }: any) => seen.push(value))
  sacredThing.upsert('Darth Vader')

  assert.deepStrictEqual(seen, ['Ani', 'Darth Vader'])
})

test('Test that sacred() sideEffect option runs on every change.', () => {
  const seen: string[] = []
  const sacredThing = sacred('Ani', {
    sideEffect: [({ value }: any) => seen.push(value)],
  })

  sacredThing.upsert('Darth Vader')

  assert.deepStrictEqual(seen, ['Darth Vader'])
})

test('Test that unobserving a sacred stops future notifications.', () => {
  const sacredThing = sacred('Ani')
  const seen: string[] = []

  const observer = sacredThing.observe(({ value }: any) => seen.push(value))
  observer.unobserve()
  sacredThing.upsert('Darth Vader')

  assert.deepStrictEqual(seen, ['Ani'])
})
