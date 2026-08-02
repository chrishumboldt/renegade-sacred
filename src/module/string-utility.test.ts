import assert from 'node:assert/strict'
import { test } from 'node:test'
import { stringGetArrayPath, stringRandom } from './string'

test('Test stringRandom returns a string of the requested length.', () => {
  assert.strictEqual(stringRandom({ length: 16 }).length, 16)
})

test('Test stringRandom defaults to a length of 10.', () => {
  assert.strictEqual(stringRandom().length, 10)
})

test('Test stringRandom textOnly excludes digits.', () => {
  const result = stringRandom({ length: 200, textOnly: true })

  assert.strictEqual(/^[A-Za-z]+$/.test(result), true)
})

test('Test stringGetArrayPath parses a plain key with no index.', () => {
  assert.deepStrictEqual(stringGetArrayPath('name'), {
    index: undefined,
    prefix: 'name',
  })
})

test('Test stringGetArrayPath parses a single-digit array index.', () => {
  assert.deepStrictEqual(stringGetArrayPath('jedi[1]'), {
    index: 1,
    prefix: 'jedi',
  })
})

test('Test stringGetArrayPath parses a multi-digit array index.', () => {
  assert.deepStrictEqual(stringGetArrayPath('jedi[12]'), {
    index: 12,
    prefix: 'jedi',
  })
})

test('Test stringGetArrayPath parses a bare array index with no prefix.', () => {
  assert.deepStrictEqual(stringGetArrayPath('[0]'), {
    index: 0,
    prefix: '',
  })
})
