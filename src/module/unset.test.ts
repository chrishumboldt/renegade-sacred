import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { SacredEvent } from '../type'
import { sacredUnset } from './unset'

test('Test that an unset event gets written.', () => {
  const events: SacredEvent[] = []

  sacredUnset({
    events,
    originalValue: {},
  })({ key: 'one.two' })

  assert.strictEqual(events.length, 1)
  assert.strictEqual(events[0].type, 'unset')
  assert.strictEqual(events[0].value, 'one.two')
})
