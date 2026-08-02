import assert from 'node:assert/strict'
import { test } from 'node:test'
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
  assert.strictEqual(sacredObject.getOriginalValue(), baseObject)
})

test('Test the sacred object event length.', () => {
  assert.strictEqual(sacredObject.getEvents().length, 4)
})

test('Test the sacred object has been upserted.', () => {
  assert.deepStrictEqual(sacredObject.getValue(), {
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

  assert.deepStrictEqual(sacredObject.getValue(), {
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
  assert.strictEqual(sacredObject.getValue().other.names[0], 'Young Ani')
})

test('Test the sacred object two original value.', () => {
  assert.strictEqual(sacredObjectTwo.getOriginalValue(), baseObjectTwo)
})

test('Test the sacred object two array index property name has been upserted.', () => {
  sacredObjectTwo.upsert({
    key: 'jedi[1].name',
    value: 'Jedi Knight Skywalker',
  })

  assert.strictEqual(
    sacredObjectTwo.getValue().jedi[1].name,
    'Jedi Knight Skywalker',
  )
})

test('Test the sacred object two array index object name has been upserted.', () => {
  sacredObjectTwo.upsert({
    key: 'jedi[1]',
    value: {
      name: 'Darth Vader',
      lightsaberColour: 'red',
    },
  })

  assert.deepStrictEqual(sacredObjectTwo.getValue().jedi[1], {
    name: 'Darth Vader',
    lightsaberColour: 'red',
  })
})

test('Test the sacred object two array is replaced.', () => {
  sacredObjectTwo.upsert({ key: 'jedi', value: baseObjectThree })

  assert.deepStrictEqual(sacredObjectTwo.getValue().jedi, baseObjectThree)
})
