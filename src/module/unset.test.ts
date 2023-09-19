import { expect, test } from 'bun:test'
import type { SacredEvent } from '../type'
import { sacredUnset } from './unset'

test('Test that an unset event gets written.', () => {
  const events: SacredEvent[] = []

  sacredUnset({
    events,
    originalValue: {},
  })({ key: 'one.two' })

  expect(events.length).toBe(1)
  expect(events[0].type).toBe('unset')
  expect(events[0].value).toBe('one.two')
})
