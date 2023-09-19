import { expect, test } from 'bun:test'
import { sacred } from './sacred'

const sacredString = sacred({ value: 'Ani' })

sacredString.upsert({ value: 'Padawan Anakin Skywalker' })
sacredString.upsert({ value: 'Anakin Skywalker' })
sacredString.upsert({ value: 'Darth Vader' })

test('Test a sacred string orignal value.', () => {
  expect(sacredString.getOriginalValue()).toBe('Ani')
})

test('Test a sacred string event length.', () => {
  expect(sacredString.getEvents().length).toBe(3)
})

test('Test the sacred string event 0.', () => {
  expect(sacredString.getEvents()[0].type).toBe('upsert')
  expect(sacredString.getEvents()[0].value).toBe('Padawan Anakin Skywalker')
})

test('Test the sacred string event 1.', () => {
  expect(sacredString.getEvents()[1].type).toBe('upsert')
  expect(sacredString.getEvents()[1].value).toBe('Anakin Skywalker')
})

test('Test the sacred string event 2.', () => {
  expect(sacredString.getEvents()[2].type).toBe('upsert')
  expect(sacredString.getEvents()[2].value).toBe('Darth Vader')
})

test('Test a sacred string current value.', () => {
  expect(sacredString.getValue()).toBe('Darth Vader')
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

  expect(sacredString2.getEvents().length).toBe(2)
})
