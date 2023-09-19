import { expect, test } from 'bun:test'
import { sacred } from './sacred'

const baseObject = {
  name: 'Anakin Skywalker',
  affiliation: 'Jedi',
  other: {
    names: ['Ani', 'Padawan Anakin Skywalker'],
  },
  lightsaber: {
    colour: 'blue',
    hilt: 'silver',
  },
}
const baseObjectTwo = {
  jedi: [
    {
      name: 'Yoda',
      lightsaberColour: 'green',
    },
    {
      name: 'Anakin Skywalker',
      lightsaberColour: 'blue',
    },
  ],
}
const baseObjectThree = [
  {
    name: 'Obi-Wan Kenobi',
    lightsaberColour: 'blue',
  },
  {
    name: 'Qui-Gon Jinn',
    lightsaberColour: 'green',
  },
]
const sacredObject = sacred<any>({
  value: baseObject,
})
const sacredObjectTwo = sacred<any>({ value: baseObjectTwo })

// Add events to the value.
sacredObject.upsert({ key: 'lightsaber.colour', value: 'red' })
sacredObject.upsert({ key: 'name', value: 'Darth Vader' })
sacredObject.upsert({ key: 'lightsaber.hilt', value: 'black' })
sacredObject.upsert({ key: 'affiliation', value: 'Sith' })

test('Test the sacred object original value.', () => {
  expect(sacredObject.getOriginalValue()).toBe(baseObject)
})

test('Test the sacred object event length.', () => {
  expect(sacredObject.getEvents().length).toBe(4)
})

test('Test the sacred object has been upserted.', () => {
  expect(sacredObject.getValue()).toStrictEqual({
    name: 'Darth Vader',
    affiliation: 'Sith',
    other: {
      names: ['Ani', 'Padawan Anakin Skywalker'],
    },
    lightsaber: {
      colour: 'red',
      hilt: 'black',
    },
  })
})

test('Test the sacred object has been upserted with an object merge.', () => {
  sacredObject.upsert({
    value: {
      affiliation: 'Sith',
      lightsaber: {
        hilt: 'black',
      },
    },
  })

  expect(sacredObject.getValue()).toStrictEqual({
    name: 'Darth Vader',
    affiliation: 'Sith',
    other: {
      names: ['Ani', 'Padawan Anakin Skywalker'],
    },
    lightsaber: {
      colour: 'red',
      hilt: 'black',
    },
  })
})

test('Test the sacred object name[0] has been changed.', () => {
  sacredObject.upsert({ key: 'other.names[0]', value: 'Young Ani' })
  expect(sacredObject.getValue().other.names[0]).toBe('Young Ani')
})

test('Test the sacred object two original value.', () => {
  expect(sacredObjectTwo.getOriginalValue()).toBe(baseObjectTwo)
})

test('Test the sacred object two array index property name has been upserted.', () => {
  sacredObjectTwo.upsert({
    key: 'jedi[1].name',
    value: 'Jedi Knight Skywalker',
  })

  expect(sacredObjectTwo.getValue().jedi[1].name).toBe('Jedi Knight Skywalker')
})

test('Test the sacred object two array index object name has been upserted.', () => {
  sacredObjectTwo.upsert({
    key: 'jedi[1]',
    value: {
      name: 'Darth Vader',
      lightsaberColour: 'red',
    },
  })

  expect(sacredObjectTwo.getValue().jedi[1]).toStrictEqual({
    name: 'Darth Vader',
    lightsaberColour: 'red',
  })
})

test('Test the sacred object two array is replaced.', () => {
  sacredObjectTwo.upsert({ key: 'jedi', value: baseObjectThree })

  expect(sacredObjectTwo.getValue().jedi).toStrictEqual(baseObjectThree)
})
