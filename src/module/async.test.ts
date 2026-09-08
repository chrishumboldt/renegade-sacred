import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sacredAsync } from './async'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

test('Test that sacredAsync starts in an idle state.', () => {
  const thing = sacredAsync(async () => 'Ani')

  assert.deepStrictEqual(thing.getValue(), {
    status: 'idle',
    data: null,
    error: null,
  })
})

test('Test that run() moves through pending to fulfilled with the resolved data.', async () => {
  const thing = sacredAsync(async (name: string) => `Padawan ${name}`)
  const seen: unknown[] = []

  thing.observe(value => seen.push(value), false)

  const result = await thing.run('Ani')

  assert.strictEqual(result, 'Padawan Ani')
  assert.deepStrictEqual(seen, [
    { status: 'pending', data: null, error: null },
    { status: 'fulfilled', data: 'Padawan Ani', error: null },
  ])
})

test('Test that run() moves through pending to rejected and still rejects the returned promise.', async () => {
  const thing = sacredAsync(async () => {
    throw new Error('no younglings')
  })

  await assert.rejects(thing.run(), /no younglings/)

  const value = thing.getValue()
  assert.strictEqual(value.status, 'rejected')
  assert.ok(value.error instanceof Error)
})

test('Test that a rejected run() clears any data left over from a previous fulfilled run().', async () => {
  const shouldFail = { current: false }
  const thing = sacredAsync(async () => {
    if (shouldFail.current) throw new Error('fail')
    return 'ok'
  })

  await thing.run()
  assert.deepStrictEqual(thing.getValue().data, 'ok')

  shouldFail.current = true
  await assert.rejects(thing.run())

  assert.strictEqual(thing.getValue().data, null)
})

test('Test that a stale (superseded) call does not overwrite a newer result.', async () => {
  const first = deferred<string>()
  const second = deferred<string>()
  const calls: Array<ReturnType<typeof deferred<string>>> = [first, second]
  let callIndex = 0

  const thing = sacredAsync(async () => calls[callIndex++].promise)

  const firstRun = thing.run()
  const secondRun = thing.run()

  // The first call resolves after the second, but should be superseded.
  second.resolve('second wins')
  await secondRun

  first.resolve('first loses')
  await firstRun

  assert.deepStrictEqual(thing.getValue(), {
    status: 'fulfilled',
    data: 'second wins',
    error: null,
  })
})

test('Test that a superseded call still resolves its own returned promise with its own result.', async () => {
  const first = deferred<string>()
  const second = deferred<string>()
  const calls: Array<ReturnType<typeof deferred<string>>> = [first, second]
  let callIndex = 0

  const thing = sacredAsync(async () => calls[callIndex++].promise)

  const firstRun = thing.run()
  const secondRun = thing.run()

  second.resolve('second wins')
  await secondRun

  first.resolve('first loses')

  assert.strictEqual(await firstRun, 'first loses')
})
