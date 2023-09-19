import { expect, test } from 'bun:test'
import { sacred } from './sacred'

const sacredArray = sacred<string[]>({
  value: ['Yoda', 'Obi-Wan Kenobi', 'Anakin Skywalker'],
})

sacredArray.upsert({ value: ['Mace Windu'] })
sacredArray.upsert({ value: ['Qui-Gon Jinn'] })
sacredArray.upsert({ key: 2, value: 'Darth Vader' })

test('Test a sacred array orignal value.', () => {
  expect(sacredArray.getOriginalValue()).toStrictEqual([
    'Yoda',
    'Obi-Wan Kenobi',
    'Anakin Skywalker',
  ])
})

test('Test a sacred array event length.', () => {
  expect(sacredArray.getEvents().length).toBe(3)
})

test('Test a sacred array event 0.', () => {
  expect(sacredArray.getEvents()[0].type).toBe('upsert')
  expect(sacredArray.getEvents()[0].value).toStrictEqual(['Mace Windu'])
})

test('Test a sacred array event 1.', () => {
  expect(sacredArray.getEvents()[1].type).toBe('upsert')
  expect(sacredArray.getEvents()[1].value).toStrictEqual(['Qui-Gon Jinn'])
})

test('Test a sacred array item was changed based on key.', () => {
  expect(sacredArray.getValue()[2]).toBe('Darth Vader')
})

test('Test a sacred array value.', () => {
  expect(sacredArray.getValue()).toStrictEqual([
    'Yoda',
    'Obi-Wan Kenobi',
    'Darth Vader',
    'Mace Windu',
    'Qui-Gon Jinn',
  ])
})
