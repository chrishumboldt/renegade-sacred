import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

const sacredArray = sacred<string[]>([
  'Yoda',
  'Obi-Wan Kenobi',
  'Anakin Skywalker',
])

sacredArray.upsert(['Mace Windu'])
sacredArray.upsert(['Qui-Gon Jinn'])
sacredArray.upsert('Darth Vader', { key: 2 })

test('Test a sacred array orignal value.', () => {
  assert.deepStrictEqual(sacredArray.getOriginalValue(), [
    'Yoda',
    'Obi-Wan Kenobi',
    'Anakin Skywalker',
  ])
})

test('Test a sacred array event length.', () => {
  assert.strictEqual(sacredArray.getEvents().length, 3)
})

test('Test a sacred array event 0.', () => {
  assert.strictEqual(sacredArray.getEvents()[0].type, 'upsert')
  assert.deepStrictEqual(sacredArray.getEvents()[0].value, ['Mace Windu'])
})

test('Test a sacred array event 1.', () => {
  assert.strictEqual(sacredArray.getEvents()[1].type, 'upsert')
  assert.deepStrictEqual(sacredArray.getEvents()[1].value, ['Qui-Gon Jinn'])
})

test('Test a sacred array item was changed based on key.', () => {
  assert.strictEqual(sacredArray.getValue()[2], 'Darth Vader')
})

test('Test a sacred array value.', () => {
  assert.deepStrictEqual(sacredArray.getValue(), [
    'Yoda',
    'Obi-Wan Kenobi',
    'Darth Vader',
    'Mace Windu',
    'Qui-Gon Jinn',
  ])
})
