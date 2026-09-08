// A stress/correctness test for using `sacred` as an application store,
// the way you'd use a Redux store: one root object, normalized entity
// maps, UI state, and lots of small dispatched updates over its lifetime.
//
// This is deliberately kept out of `npm test` since it's not fast-suite
// material, it's a load test you run on demand.
//
// Usage: npm run build && npm run stress

const assert = require('node:assert/strict')
const { sacred, sacredMerge } = require('../dist/index.js')

const POST_COUNT = 1000
const COMMENT_COUNT = 2000
const MISC_ACTION_COUNT = 2000

let checksPassed = 0

function check(label, actual, expected) {
  assert.deepStrictEqual(actual, expected)
  checksPassed += 1
  console.log(`  ✓ ${label}`)
}

function timeIt(label, fn) {
  const start = process.hrtime.bigint()
  const result = fn()
  const end = process.hrtime.bigint()
  console.log(`${label}: ${(Number(end - start) / 1e6).toFixed(2)}ms`)
  return result
}

console.log('=== Sacred as a Redux-style application store ===\n')

// A realistic normalized app-state shape.
const initialState = {
  auth: {
    isAuthenticated: true,
    token: 'abc123',
  },
  user: {
    id: 1,
    name: 'Anakin Skywalker',
    email: 'ani@jedi.temple',
    roles: ['padawan'],
  },
  ui: {
    theme: 'dark',
    sidebarOpen: true,
    notifications: [],
  },
  entities: {
    posts: {},
    comments: {},
  },
  postIds: [],
}

const store = sacred(initialState)

// Phase 1: create posts.
//
// Growing a nested array field by repeatedly upserting a single-item
// replacement does NOT append. Array merge is positional, so every call
// overwrites index 0. Use an indexed key path per item: `postIds[i]`.
timeIt(`Phase 1: dispatch ${POST_COUNT} "createPost" actions`, () => {
  for (let i = 0; i < POST_COUNT; i++) {
    const id = `post-${i}`
    store.upsert(
      { id, title: `Post ${i}`, likes: 0, authorId: 1 },
      { key: `entities.posts.${id}` },
    )
    store.upsert(id, { key: `postIds[${i}]` })
  }
})

// Phase 2: add comments, referencing posts.
timeIt(`Phase 2: dispatch ${COMMENT_COUNT} "addComment" actions`, () => {
  for (let i = 0; i < COMMENT_COUNT; i++) {
    const postId = `post-${i % POST_COUNT}`
    const commentId = `comment-${i}`
    store.upsert(
      { id: commentId, postId, text: `Comment ${i}` },
      { key: `entities.comments.${commentId}` },
    )
  }
})

// Phase 3: mixed likes/UI churn. Overwrites existing keys, doesn't
// grow the entity count.
timeIt(`Phase 3: dispatch ${MISC_ACTION_COUNT} misc like/UI actions`, () => {
  for (let i = 0; i < MISC_ACTION_COUNT; i++) {
    const postId = `post-${i % POST_COUNT}`
    store.upsert(i, { key: `entities.posts.${postId}.likes` })
    store.upsert(i % 2 === 0, { key: 'ui.sidebarOpen' })

    if (i % 200 === 0) {
      store.upsert(
        { id: i, message: `Notification ${i}` },
        { key: `ui.notifications[${Math.floor(i / 200)}]` },
      )
    }
  }
})

// Correctness checks.
console.log('\nCorrectness checks:')
const finalValue = store.getValue()

check(
  'every post survived',
  Object.keys(finalValue.entities.posts).length,
  POST_COUNT,
)
check(
  'every comment survived',
  Object.keys(finalValue.entities.comments).length,
  COMMENT_COUNT,
)
check('postIds grew to the full count, in order', finalValue.postIds.length, POST_COUNT)
check('postIds[0] is post-0 (order preserved)', finalValue.postIds[0], 'post-0')
check(
  `postIds[${POST_COUNT - 1}] is the last post (no gaps)`,
  finalValue.postIds[POST_COUNT - 1],
  `post-${POST_COUNT - 1}`,
)
check('a comment correctly references its post', finalValue.entities.comments['comment-0'].postId, 'post-0')
check(
  'notifications grew instead of being clobbered',
  finalValue.ui.notifications.length,
  Math.ceil(MISC_ACTION_COUNT / 200),
)
check('untouched user data was never disturbed', finalValue.user, initialState.user)
check('untouched auth slice was never disturbed', finalValue.auth, initialState.auth)

console.log(`\n${checksPassed} correctness checks passed.`)

// Read performance after a heavy write history.
console.log()
timeIt('100k getValue() reads after the write history above', () => {
  for (let i = 0; i < 100000; i++) store.getValue()
})

// Scaling: a large flat entity map vs. small bounded slices.
//
// Writes to a small bounded slice are flat, since only the touched
// branch is rebuilt. Writing into one large flat map still costs its
// size, since `{ ...bigObject, oneKey: value }` is O(size) in plain JS.
// eventLimit only bounds the event log, not this.
console.log('\nScaling check: writing into ONE large flat map as it grows')
console.log('(this stays expensive regardless of eventLimit, see the comment above)\n')

function scalingRun(label, eventLimit) {
  const s = sacred({ entities: { items: {} } }, { eventLimit })
  const BATCH = 200
  const BATCHES = 8
  console.log(`  ${label}:`)
  for (let b = 0; b < BATCHES; b++) {
    const start = process.hrtime.bigint()
    for (let i = 0; i < BATCH; i++) {
      const n = b * BATCH + i
      s.upsert({ id: n }, { key: `entities.items.item-${n}` })
    }
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    console.log(
      `    batch ${b}: ${ms.toFixed(1)}ms  (total entities: ${(b + 1) * BATCH}, events: ${s.getEvents().length})`,
    )
  }
}

scalingRun('eventLimit: 0 (unlimited)', 0)
scalingRun('eventLimit: 1000 (default)', undefined)

// sacredMerge stress, combineReducers-style.
console.log('\nsacredMerge: combining 3 slices, 5000 updates to one of them:')
const authSlice = sacred(initialState.auth)
const uiSlice = sacred(initialState.ui)
const userSlice = sacred(initialState.user)
const combined = sacredMerge([authSlice, uiSlice, userSlice])

let notifications = 0
combined.observe(() => {
  notifications += 1
})

timeIt('  5000 dispatches to uiSlice', () => {
  for (let i = 0; i < 5000; i++) {
    uiSlice.upsert(i % 2 === 0, { key: 'sidebarOpen' })
  }
})
check('merge observer fired once per update (+1 initial)', notifications, 5001)

console.log('\n=== Stress test complete, all checks passed ===')
console.log(
  'Writes to small, bounded slices (see the sacredMerge section) are flat',
)
console.log(
  'regardless of accumulated state elsewhere. Writes into one large flat',
)
console.log(
  'entity map (see the "Scaling check" section) still cost roughly the size',
)
console.log(
  'of that map, an inherent plain-object limitation, not an eventLimit one.',
)
