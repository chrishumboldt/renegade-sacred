import { expect, test } from 'bun:test'
import { sacred } from './sacred'

test('Test that you can collapse the events.', () => {
  const sacredThing = sacred({
    value: { name: 'Ani' },
  })

  sacredThing.upsert({ value: { name: 'Padawan Skywalker', age: 16 } })
  sacredThing.upsert({ value: { name: 'Jedi Knight Skywalker', age: 25 } })
  sacredThing.upsert({ value: { name: 'Darth Vader' } })

  expect(sacredThing.getEvents().length).toBe(3)

  sacredThing.collapseEvents()

  expect(sacredThing.getEvents().length).toBe(1)
  expect(sacredThing.getEvents()[0].value).toStrictEqual({
    name: 'Darth Vader',
    age: 25,
  })
})
