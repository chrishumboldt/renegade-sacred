import { expect, test } from 'bun:test'
import { sacred } from './sacred'

const sacredBoolean = sacred({ value: true })

sacredBoolean.upsert({ value: false })
sacredBoolean.upsert({ value: true })
sacredBoolean.upsert({ value: false })

test('Test a sacred boolean orignal value.', () => {
  expect(sacredBoolean.getOriginalValue()).toBe(true)
})

test('Test a sacred boolean event length.', () => {
  expect(sacredBoolean.getEvents().length).toBe(3)
})

test('Test the sacred boolean event 0.', () => {
  expect(sacredBoolean.getEvents()[0].type).toBe('upsert')
  expect(sacredBoolean.getEvents()[0].value).toBe(false)
})

test('Test the sacred boolean event 1.', () => {
  expect(sacredBoolean.getEvents()[1].type).toBe('upsert')
  expect(sacredBoolean.getEvents()[1].value).toBe(true)
})

test('Test the sacred boolean event 2.', () => {
  expect(sacredBoolean.getEvents()[2].type).toBe('upsert')
  expect(sacredBoolean.getEvents()[2].value).toBe(false)
})

test('Test a sacred boolean current value.', () => {
  expect(sacredBoolean.getValue()).toBe(false)
})
