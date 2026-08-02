import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SacredAggregateAuto } from '../type'
import { sacredAggregateAuto, sacredAggregateValue } from './aggregate'
import { sacred } from './sacred'

test('Test a basic value aggregation.', () => {
  assert.deepStrictEqual(
    sacredAggregateValue({
      events: [
        { type: 'upsert', value: { name: 'Ani' } },
        { type: 'upsert', value: { age: 9 } },
      ],
      originalValue: {},
    }),
    {
      name: 'Ani',
      age: 9,
    },
  )
})

test('Test a basic value aggregation with an unset.', () => {
  assert.strictEqual(
    sacredAggregateValue({
      events: [
        { type: 'upsert', value: { name: 'Ani', age: 9 } },
        { type: 'unset', value: 'age' },
      ],
      originalValue: {},
    }).age,
    undefined,
  )
})

test('Test a value aggregation array with an unset.', () => {
  assert.strictEqual(
    sacredAggregateValue({
      events: [
        {
          type: 'upsert',
          value: [{ name: 'Yoda', lightsaberColour: 'green' }],
        },
        {
          type: 'upsert',
          value: [{ name: 'Obi-Wan Kenobi', lightsaberColour: 'blue' }],
        },
        { type: 'unset', value: '[0]' },
      ],
      originalValue: [],
    }).length,
    1,
  )
})

test('Test a complex aggregation with an unset.', () => {
  assert.strictEqual(
    sacredAggregateValue({
      events: [
        {
          type: 'upsert',
          value: {
            type: 'jedi',
            jedi: [
              { name: 'Yoda', lightsaberColour: 'green' },
              { name: 'Obi-Wan Kenobi', lightsaberColour: 'blue' },
            ],
          },
        },
        { type: 'unset', value: 'jedi[0].name' },
      ],
      originalValue: {},
    }).jedi[0].name,
    undefined,
  )
})

test('Test that value auto aggregation works while adding events over time.', () => {
  const autoAggregationOne: SacredAggregateAuto = {
    events: [],
    options: {
      eventLimit: 2,
    },
    originalValue: {},
  }

  assert.strictEqual(sacredAggregateAuto(autoAggregationOne).events.length, 0)

  autoAggregationOne.events.push({
    value: { name: 'Ani', age: 9 },
    type: 'upsert',
  })

  autoAggregationOne.events.push({
    value: { name: 'Padawan Anikin Skywalker', age: 12 },
    type: 'upsert',
  })

  assert.strictEqual(sacredAggregateAuto(autoAggregationOne).events.length, 2)

  autoAggregationOne.events.push({
    value: { name: 'Jedi Knight Anakin Skywalker', age: 18 },
    type: 'upsert',
  })

  assert.strictEqual(sacredAggregateAuto(autoAggregationOne).events.length, 2)

  autoAggregationOne.events.push({
    value: { name: 'Darth Vader', age: 24 },
    type: 'upsert',
  })

  assert.strictEqual(sacredAggregateAuto(autoAggregationOne).events.length, 2)

  assert.deepStrictEqual(autoAggregationOne.events[0], {
    type: 'upsert',
    value: { name: 'Jedi Knight Anakin Skywalker', age: 18 },
  })

  assert.deepStrictEqual(autoAggregationOne.events[1], {
    type: 'upsert',
    value: { name: 'Darth Vader', age: 24 },
  })
})

test('Test that sacred() defaults eventLimit to 1000.', () => {
  const sacredThing = sacred({ value: { count: 0 } })

  assert.strictEqual(sacredThing.getOptions().eventLimit, 1000)
})

test('Test that the default eventLimit keeps the event history bounded.', () => {
  const sacredThing = sacred({ value: { count: 0 } })

  for (let i = 0; i < 1500; i++) {
    sacredThing.upsert({ key: 'count', value: i })
  }

  assert.ok(sacredThing.getEvents().length <= 1000)
  assert.strictEqual(sacredThing.getValue().count, 1499)
})

test('Test that eventLimit: 0 opts out of the default and allows unlimited growth.', () => {
  const sacredThing = sacred({ value: { count: 0 }, eventLimit: 0 })

  for (let i = 0; i < 1500; i++) {
    sacredThing.upsert({ key: 'count', value: i })
  }

  assert.strictEqual(sacredThing.getEvents().length, 1500)
  assert.strictEqual(sacredThing.getValue().count, 1499)
})
