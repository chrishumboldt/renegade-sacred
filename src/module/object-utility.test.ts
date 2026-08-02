import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  objectClone,
  objectCreateFromKeyValue,
  objectMerge,
  objectMergeImmutable,
  objectUnset,
  objectUnsetImmutable,
} from './object'

test('Test objectClone deep clones nested objects and arrays.', () => {
  const source = { name: 'Ani', attributes: { age: 9 }, tags: ['padawan'] }
  const clone = objectClone(source)

  clone.attributes.age = 99
  clone.tags.push('jedi')

  assert.deepStrictEqual(source.attributes, { age: 9 })
  assert.deepStrictEqual(source.tags, ['padawan'])
  assert.deepStrictEqual(clone, {
    name: 'Ani',
    attributes: { age: 99 },
    tags: ['padawan', 'jedi'],
  })
})

test('Test objectClone drops null and undefined valued keys.', () => {
  const clone = objectClone({ name: 'Ani', age: null, title: undefined })

  assert.deepStrictEqual(clone, { name: 'Ani' })
})

test('Test objectCreateFromKeyValue builds a nested object from a dot path.', () => {
  assert.deepStrictEqual(
    objectCreateFromKeyValue({ key: 'attributes.age', value: 9 }),
    { attributes: { age: 9 } },
  )
})

test('Test objectCreateFromKeyValue builds an array from a bracket path.', () => {
  const result = objectCreateFromKeyValue({
    key: 'jedi[1].name',
    value: 'Yoda',
  })

  assert.strictEqual(result.jedi.length, 2)
  assert.deepStrictEqual(result.jedi[1], { name: 'Yoda' })
})

test('Test objectMerge deep merges nested objects, mutating and returning the source.', () => {
  const source = { name: 'Ani', attributes: { age: 9, lightsaber: false } }
  const merged = objectMerge(source, { attributes: { age: 18 } })

  const expected = {
    name: 'Ani',
    attributes: { age: 18, lightsaber: false },
  }
  assert.deepStrictEqual(merged, expected)
  assert.deepStrictEqual(source, expected)
  assert.strictEqual(merged, source)
})

test('Test objectMerge replaces array items positionally.', () => {
  const source = { jedi: [{ name: 'Yoda' }, { name: 'Obi-Wan' }] }
  const merged = objectMerge(source, { jedi: [{ name: 'Qui-Gon' }] })

  assert.deepStrictEqual(merged, {
    jedi: [{ name: 'Qui-Gon' }, { name: 'Obi-Wan' }],
  })
})

test('Test objectUnset deletes a plain property, mutating and returning the input.', () => {
  const input = { name: 'Ani', age: 9 }
  const result = objectUnset({ key: 'age', input })

  assert.deepStrictEqual(result, { name: 'Ani' })
  assert.strictEqual(result, input)
})

test('Test objectUnset deletes a nested property, mutating the input.', () => {
  const input = { attributes: { age: 9, lightsaber: false } }
  objectUnset({ key: 'attributes.age', input })

  assert.deepStrictEqual(input, { attributes: { lightsaber: false } })
})

test('Test objectUnset removes a whole array element addressed by a prefixed path.', () => {
  const input = { jedi: [{ name: 'Yoda' }, { name: 'Obi-Wan Kenobi' }] }
  objectUnset({ key: 'jedi[0]', input })

  assert.deepStrictEqual(input, { jedi: [{ name: 'Obi-Wan Kenobi' }] })
})

test('Test objectUnset removes a top-level array element with no prefix.', () => {
  const input = ['Yoda', 'Obi-Wan Kenobi']
  objectUnset({ key: '[0]', input })

  assert.deepStrictEqual(input, ['Obi-Wan Kenobi'])
})

// Copy-on-write variants - used wherever the value being updated might
// already be held externally (e.g. by a caller's earlier getValue()).

test('Test objectMergeImmutable does not mutate the source.', () => {
  const source = { name: 'Ani', attributes: { age: 9 } }
  objectMergeImmutable(source, { attributes: { age: 18 } })

  assert.deepStrictEqual(source, { name: 'Ani', attributes: { age: 9 } })
})

test('Test objectMergeImmutable shares untouched sibling branches by reference.', () => {
  const untouchedSibling = { lightsaber: false }
  const source = { name: 'Ani', attributes: untouchedSibling }
  const merged = objectMergeImmutable<{
    name: string
    attributes: unknown
  }>(source, { name: 'Darth Vader' })

  assert.strictEqual(merged.attributes, untouchedSibling)
})

test('Test objectUnsetImmutable removes a property without mutating the input.', () => {
  const input = { name: 'Ani', age: 9 }
  const result = objectUnsetImmutable({ key: 'age', input })

  assert.deepStrictEqual(result, { name: 'Ani' })
  assert.deepStrictEqual(input, { name: 'Ani', age: 9 })
})

test('Test objectUnsetImmutable removes a whole array element without mutating the input.', () => {
  const input = { jedi: [{ name: 'Yoda' }, { name: 'Obi-Wan Kenobi' }] }
  const result = objectUnsetImmutable({ key: 'jedi[0]', input })

  assert.deepStrictEqual(result, { jedi: [{ name: 'Obi-Wan Kenobi' }] })
  assert.deepStrictEqual(input, {
    jedi: [{ name: 'Yoda' }, { name: 'Obi-Wan Kenobi' }],
  })
})

test('Test objectUnsetImmutable removes a top-level array element without mutating the input.', () => {
  const input = ['Yoda', 'Obi-Wan Kenobi']
  const result = objectUnsetImmutable({ key: '[0]', input })

  assert.deepStrictEqual(result, ['Obi-Wan Kenobi'])
  assert.deepStrictEqual(input, ['Yoda', 'Obi-Wan Kenobi'])
})

test('Test objectUnsetImmutable shares untouched sibling branches by reference.', () => {
  const untouchedSibling = { colour: 'green' }
  const input = {
    jedi: { name: 'Yoda', extra: 'gone' },
    saber: untouchedSibling,
  }
  const result = objectUnsetImmutable({ key: 'jedi.extra', input })

  assert.strictEqual(result.saber, untouchedSibling)
})
