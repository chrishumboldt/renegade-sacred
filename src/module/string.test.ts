import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

const sacredString = sacred({ value: 'Ani' })

sacredString.upsert({ value: 'Padawan Anakin Skywalker' })
sacredString.upsert({ value: 'Anakin Skywalker' })
sacredString.upsert({ value: 'Darth Vader' })

test('Test a sacred string orignal value.', () => {
  assert.strictEqual(sacredString.getOriginalValue(), 'Ani')
})

test('Test a sacred string event length.', () => {
  assert.strictEqual(sacredString.getEvents().length, 3)
})

test('Test the sacred string event 0.', () => {
  assert.strictEqual(sacredString.getEvents()[0].type, 'upsert')
  assert.strictEqual(
    sacredString.getEvents()[0].value,
    'Padawan Anakin Skywalker',
  )
})

test('Test the sacred string event 1.', () => {
  assert.strictEqual(sacredString.getEvents()[1].type, 'upsert')
  assert.strictEqual(sacredString.getEvents()[1].value, 'Anakin Skywalker')
})

test('Test the sacred string event 2.', () => {
  assert.strictEqual(sacredString.getEvents()[2].type, 'upsert')
  assert.strictEqual(sacredString.getEvents()[2].value, 'Darth Vader')
})

test('Test a sacred string current value.', () => {
  assert.strictEqual(sacredString.getValue(), 'Darth Vader')
})

test('Test a sacred string does not upsert if the value is the same and the changeOnly flag is set.', () => {
  const sacredString2 = sacred({ value: 'Ani', changeOnly: true })

  sacredString2.upsert({ value: 'Ani' })
  sacredString2.upsert({ value: 'Ani' })
  sacredString2.upsert({ value: 'Ani' })
  sacredString2.upsert({ value: 'Ani' })
  sacredString2.upsert({ value: 'Ani' })
  sacredString2.upsert({ value: 'Ani' })
  sacredString2.upsert({ value: 'Ani' })
  sacredString2.upsert({ value: 'Darth Vader' })

  assert.strictEqual(sacredString2.getEvents().length, 2)
})
