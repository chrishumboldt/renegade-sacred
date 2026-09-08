import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacred } from './sacred'

test('Test that a value returned by getValue() is never mutated by a later write.', () => {
  const sacredThing = sacred({ ui: { sidebarOpen: false } })
  const before = sacredThing.getValue()

  sacredThing.upsert(true, { key: 'ui.sidebarOpen' })

  assert.deepStrictEqual(before, { ui: { sidebarOpen: false } })
  assert.deepStrictEqual(sacredThing.getValue(), { ui: { sidebarOpen: true } })
})

test('Test that a branch untouched by a write keeps the same reference (structural sharing).', () => {
  const sacredThing = sacred({
    auth: { token: 'a' },
    ui: { sidebarOpen: false },
  })
  const authBefore = sacredThing.getValue().auth

  sacredThing.upsert(true, { key: 'ui.sidebarOpen' })

  assert.strictEqual(sacredThing.getValue().auth, authBefore)
})

test('Test that a branch touched by a write gets a new reference.', () => {
  const sacredThing = sacred({ ui: { sidebarOpen: false } })
  const uiBefore = sacredThing.getValue().ui

  sacredThing.upsert(true, { key: 'ui.sidebarOpen' })

  assert.notStrictEqual(sacredThing.getValue().ui, uiBefore)
})

test('Test that unset also preserves old snapshots and shares untouched branches.', () => {
  const sacredThing = sacred<any>({
    user: { name: 'Ani', age: 9 },
    ui: { sidebarOpen: false },
  })
  const before = sacredThing.getValue()
  const uiBefore = before.ui

  sacredThing.unset('user.age')

  assert.deepStrictEqual(before.user, { name: 'Ani', age: 9 })
  assert.deepStrictEqual(sacredThing.getValue().user, { name: 'Ani' })
  assert.strictEqual(sacredThing.getValue().ui, uiBefore)
})
