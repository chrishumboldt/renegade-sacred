import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'
import { sacredSelect } from './select'

test('Test that a select reflects the initial selected value.', () => {
  const source = sacred<any>({ ui: { open: false }, auth: { token: 'a' } })
  const ui = sacredSelect(source, value => value.ui)

  assert.deepStrictEqual(ui.getValue(), { open: false })
})

test('Test that a select notifies observers when the selected slice changes.', () => {
  const source = sacred<any>({ ui: { open: false } })
  const ui = sacredSelect(source, value => value.ui)
  const seen: unknown[] = []

  ui.observe(value => seen.push(value))
  source.upsert(true, { key: 'ui.open' })

  assert.deepStrictEqual(seen, [{ open: false }, { open: true }])
})

test('Test that a select does not notify observers when an unrelated branch changes (structural sharing).', () => {
  const source = sacred<any>({ ui: { open: false }, auth: { token: 'a' } })
  const ui = sacredSelect(source, value => value.ui)
  let calls = 0

  ui.observe(() => {
    calls += 1
  }, false)

  source.upsert('b', { key: 'auth.token' })

  assert.strictEqual(calls, 0)
  assert.deepStrictEqual(ui.getValue(), { open: false })
})

test('Test that a select supports a custom isEqual comparator.', () => {
  const source = sacred<any>({ id: 1, name: 'Ani' })
  const idOnly = sacredSelect(source, value => ({ id: value.id }), {
    isEqual: (a, b) => a.id === b.id,
  })
  let calls = 0

  idOnly.observe(() => {
    calls += 1
  }, false)

  source.upsert('Darth Vader', { key: 'name' })
  assert.strictEqual(calls, 0)

  source.upsert(2, { key: 'id' })
  assert.strictEqual(calls, 1)
})

test('Test that a select supports multiple independent subscribers.', () => {
  const source = sacred<any>({ count: 1 })
  const count = sacredSelect(source, value => value.count)
  const seenByOne: unknown[] = []
  const seenByTwo: unknown[] = []

  count.observe(value => seenByOne.push(value))
  count.observe(value => seenByTwo.push(value))

  source.upsert(2, { key: 'count' })

  assert.deepStrictEqual(seenByOne, [1, 2])
  assert.deepStrictEqual(seenByTwo, [1, 2])
})

test('Test that unobserving one subscriber does not affect another.', () => {
  const source = sacred<any>({ count: 1 })
  const count = sacredSelect(source, value => value.count)
  const seenByOne: unknown[] = []
  const seenByTwo: unknown[] = []

  const subscriberOne = count.observe(value => seenByOne.push(value))
  count.observe(value => seenByTwo.push(value))

  subscriberOne.unobserve()
  source.upsert(2, { key: 'count' })

  assert.deepStrictEqual(seenByOne, [1])
  assert.deepStrictEqual(seenByTwo, [1, 2])
})

test('Test that unobserving a select releases the underlying source observer.', () => {
  const source = sacred<any>({ count: 1 })
  const count = sacredSelect(source, value => value.count)

  assert.strictEqual(source.getObserverCount(), 1)

  const observer = count.observe(() => {})
  observer.unobserve()

  assert.strictEqual(source.getObserverCount(), 0)
})
