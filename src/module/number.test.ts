import { expect, test } from 'bun:test'
import { sacred } from './sacred'

const sacredNumber = sacred({ value: 1 })

sacredNumber.upsert({ value: 2 })
sacredNumber.upsert({ value: 3 })
sacredNumber.upsert({ value: 4 })

test('Test the sacred number orignal value.', () => {
  expect(sacredNumber.getOriginalValue()).toBe(1)
})

test('Test the sacred number event count.', () => {
  expect(sacredNumber.getEvents().length).toBe(3)
})

test('Test the sacred number event 0.', () => {
  expect(sacredNumber.getEvents()[0].type).toBe('upsert')
  expect(sacredNumber.getEvents()[0].value).toBe(2)
})

test('Test the sacred number event 1.', () => {
  expect(sacredNumber.getEvents()[1].type).toBe('upsert')
  expect(sacredNumber.getEvents()[1].value).toBe(3)
})

test('Test the sacred number event 2.', () => {
  expect(sacredNumber.getEvents()[2].type).toBe('upsert')
  expect(sacredNumber.getEvents()[2].value).toBe(4)
})

test('Test the sacred number current value.', () => {
  expect(sacredNumber.getValue()).toBe(4)
})
