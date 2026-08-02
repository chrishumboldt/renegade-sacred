import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

const sacredNumber = sacred({ value: 1 })

sacredNumber.upsert({ value: 2 })
sacredNumber.upsert({ value: 3 })
sacredNumber.upsert({ value: 4 })

test('Test the sacred number orignal value.', () => {
  assert.strictEqual(sacredNumber.getOriginalValue(), 1)
})

test('Test the sacred number event count.', () => {
  assert.strictEqual(sacredNumber.getEvents().length, 3)
})

test('Test the sacred number event 0.', () => {
  assert.strictEqual(sacredNumber.getEvents()[0].type, 'upsert')
  assert.strictEqual(sacredNumber.getEvents()[0].value, 2)
})

test('Test the sacred number event 1.', () => {
  assert.strictEqual(sacredNumber.getEvents()[1].type, 'upsert')
  assert.strictEqual(sacredNumber.getEvents()[1].value, 3)
})

test('Test the sacred number event 2.', () => {
  assert.strictEqual(sacredNumber.getEvents()[2].type, 'upsert')
  assert.strictEqual(sacredNumber.getEvents()[2].value, 4)
})

test('Test the sacred number current value.', () => {
  assert.strictEqual(sacredNumber.getValue(), 4)
})
