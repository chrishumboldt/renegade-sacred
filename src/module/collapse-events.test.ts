import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

test('Test that you can collapse the events.', () => {
  const sacredThing = sacred({
    value: { name: 'Ani' },
  })

  sacredThing.upsert({ value: { name: 'Padawan Skywalker', age: 16 } })
  sacredThing.upsert({ value: { name: 'Jedi Knight Skywalker', age: 25 } })
  sacredThing.upsert({ value: { name: 'Darth Vader' } })

  assert.strictEqual(sacredThing.getEvents().length, 3)

  sacredThing.collapseEvents()

  assert.strictEqual(sacredThing.getEvents().length, 1)
  assert.deepStrictEqual(sacredThing.getEvents()[0].value, {
    name: 'Darth Vader',
    age: 25,
  })
})
