import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

const sacredBoolean = sacred({ value: true })

sacredBoolean.upsert({ value: false })
sacredBoolean.upsert({ value: true })
sacredBoolean.upsert({ value: false })

test('Test a sacred boolean orignal value.', () => {
  assert.strictEqual(sacredBoolean.getOriginalValue(), true)
})

test('Test a sacred boolean event length.', () => {
  assert.strictEqual(sacredBoolean.getEvents().length, 3)
})

test('Test the sacred boolean event 0.', () => {
  assert.strictEqual(sacredBoolean.getEvents()[0].type, 'upsert')
  assert.strictEqual(sacredBoolean.getEvents()[0].value, false)
})

test('Test the sacred boolean event 1.', () => {
  assert.strictEqual(sacredBoolean.getEvents()[1].type, 'upsert')
  assert.strictEqual(sacredBoolean.getEvents()[1].value, true)
})

test('Test the sacred boolean event 2.', () => {
  assert.strictEqual(sacredBoolean.getEvents()[2].type, 'upsert')
  assert.strictEqual(sacredBoolean.getEvents()[2].value, false)
})

test('Test a sacred boolean current value.', () => {
  assert.strictEqual(sacredBoolean.getValue(), false)
})
