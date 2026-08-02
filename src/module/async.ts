import { sacred } from './sacred'
import type { SacredAsyncOptions, SacredAsyncState } from '../type'

// Wraps a promise-returning function in a status sacred, the way most
// libraries model async: idle -> pending -> fulfilled/rejected. Built
// entirely on public upsert calls, same as sacredMerge/sacredSelect - it
// doesn't touch the core, it just reacts and writes.
export function sacredAsync<Args extends any[], D>(
  run: (...args: Args) => Promise<D>,
  options: SacredAsyncOptions = {},
) {
  const state = sacred<SacredAsyncState<D>>(
    { status: 'idle', data: null, error: null },
    options,
  )

  // Guards against a stale call's resolution overwriting a newer one's
  // (e.g. two overlapping calls where the first-started settles last).
  // Each call gets its own promise settlement either way - only the
  // sacred write is skipped when a call has been superseded.
  let generation = 0

  return {
    getValue(): SacredAsyncState<D> {
      return state.getValue()
    },
    observe(
      effect: (value: SacredAsyncState<D>) => void,
      triggerOnObserve = true,
    ) {
      return state.observe(({ value }) => effect(value), triggerOnObserve)
    },
    run(...args: Args): Promise<D> {
      const thisGeneration = ++generation

      state.upsert({ status: 'pending', data: null, error: null })

      return run(...args).then(
        data => {
          if (thisGeneration === generation) {
            state.upsert({ status: 'fulfilled', data, error: null })
          }
          return data
        },
        error => {
          if (thisGeneration === generation) {
            state.upsert({ status: 'rejected', data: null, error })
          }
          throw error
        },
      )
    },
  }
}
