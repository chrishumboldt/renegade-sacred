import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isArray, isObject } from './is'

test('Test isArray recognises arrays and rejects everything else.', () => {
  assert.strictEqual(isArray([1, 2, 3]), true)
  assert.strictEqual(isArray({}), false)
  assert.strictEqual(isArray('array'), false)
  assert.strictEqual(isArray(null), false)
})

test('Test isObject recognises objects and arrays but rejects primitives.', () => {
  assert.strictEqual(isObject({}), true)
  assert.strictEqual(isObject([]), true)
  assert.strictEqual(isObject('object'), false)
  assert.strictEqual(isObject(1), false)
})
