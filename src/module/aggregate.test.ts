import { expect, test } from 'bun:test'
import type { SacredAggregateAuto } from '../type'
import { sacredAggregateAuto, sacredAggregateValue } from './aggregate'

test('Test a basic value aggregation.', () => {
  expect(
    sacredAggregateValue({
      events: [
        { type: 'upsert', value: { name: 'Ani' } },
        { type: 'upsert', value: { age: 9 } },
      ],
      originalValue: {},
    }),
  ).toStrictEqual({
    name: 'Ani',
    age: 9,
  })
})

test('Test a basic value aggregation with an unset.', () => {
  expect(
    sacredAggregateValue({
      events: [
        { type: 'upsert', value: { name: 'Ani', age: 9 } },
        { type: 'unset', value: 'age' },
      ],
      originalValue: {},
    }).age,
  ).toBe(undefined)
})

test('Test a value aggregation array with an unset.', () => {
  expect(
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
  ).toBe(1)
})

test('Test a complex aggregation with an unset.', () => {
  expect(
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
  ).toBe(undefined)
})

test('Test that value auto aggregation works while adding events over time.', () => {
  const autoAggregationOne: SacredAggregateAuto = {
    events: [],
    options: {
      eventLimit: 2,
    },
    originalValue: {},
  }

  expect(sacredAggregateAuto(autoAggregationOne).events.length).toBe(0)

  autoAggregationOne.events.push({
    value: { name: 'Ani', age: 9 },
    type: 'upsert',
  })

  autoAggregationOne.events.push({
    value: { name: 'Padawan Anikin Skywalker', age: 12 },
    type: 'upsert',
  })

  expect(sacredAggregateAuto(autoAggregationOne).events.length).toBe(2)

  autoAggregationOne.events.push({
    value: { name: 'Jedi Knight Anakin Skywalker', age: 18 },
    type: 'upsert',
  })

  expect(sacredAggregateAuto(autoAggregationOne).events.length).toBe(2)

  autoAggregationOne.events.push({
    value: { name: 'Darth Vader', age: 24 },
    type: 'upsert',
  })

  expect(sacredAggregateAuto(autoAggregationOne).events.length).toBe(2)

  expect(autoAggregationOne.events[0]).toStrictEqual({
    type: 'upsert',
    value: { name: 'Jedi Knight Anakin Skywalker', age: 18 },
  })

  expect(autoAggregationOne.events[1]).toStrictEqual({
    type: 'upsert',
    value: { name: 'Darth Vader', age: 24 },
  })
})
