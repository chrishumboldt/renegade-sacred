// A stress/correctness test for using `sacred` as an application store,
// the way you'd use a Redux store: one root object, normalized entity
// maps, UI state, and lots of small dispatched updates over its lifetime.
//
// This is deliberately kept out of `npm test` — it's not fast-suite
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

const store = sacred({ value: initialState })

// --- Phase 1: create posts -------------------------------------------------
//
// IMPORTANT (found while building this): growing a nested array field by
// repeatedly upserting a single-item replacement, e.g.
//   store.upsert({ key: 'postIds', value: [id] })
// does NOT append. Merge is positional for arrays, so every call just
// overwrites index 0 and prior entries are silently lost. The correct
// pattern is an indexed key path per item: `postIds[i]`.
timeIt(`Phase 1: dispatch ${POST_COUNT} "createPost" actions`, () => {
  for (let i = 0; i < POST_COUNT; i++) {
    const id = `post-${i}`
    store.upsert({
      key: `entities.posts.${id}`,
      value: { id, title: `Post ${i}`, likes: 0, authorId: 1 },
    })
    store.upsert({ key: `postIds[${i}]`, value: id })
  }
})

// --- Phase 2: add comments, referencing posts -------------------------------
timeIt(`Phase 2: dispatch ${COMMENT_COUNT} "addComment" actions`, () => {
  for (let i = 0; i < COMMENT_COUNT; i++) {
    const postId = `post-${i % POST_COUNT}`
    const commentId = `comment-${i}`
    store.upsert({
      key: `entities.comments.${commentId}`,
      value: { id: commentId, postId, text: `Comment ${i}` },
    })
  }
})

// --- Phase 3: mixed likes/UI churn (overwrites existing keys, doesn't grow
// the entity count) -----------------------------------------------------------
timeIt(`Phase 3: dispatch ${MISC_ACTION_COUNT} misc like/UI actions`, () => {
  for (let i = 0; i < MISC_ACTION_COUNT; i++) {
    const postId = `post-${i % POST_COUNT}`
    store.upsert({ key: `entities.posts.${postId}.likes`, value: i })
    store.upsert({ key: 'ui.sidebarOpen', value: i % 2 === 0 })

    if (i % 200 === 0) {
      store.upsert({
        key: `ui.notifications[${Math.floor(i / 200)}]`,
        value: { id: i, message: `Notification ${i}` },
      })
    }
  }
})

// --- Correctness checks ------------------------------------------------------
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

// --- Read performance after a heavy write history ---------------------------
console.log()
timeIt('100k getValue() reads after the write history above', () => {
  for (let i = 0; i < 100000; i++) store.getValue()
})

// --- Scaling behavior: a large flat entity map vs. small bounded slices ----
//
// Writes now apply the newest event onto the previously cached value
// instead of refolding the whole event history (see
// sacredAggregateValueApply), and that cached value is only ever produced
// via copy-on-write - untouched branches are shared by reference, touched
// branches get a fresh one, and a value returned by an earlier getValue()
// is never mutated by a later write (see immutability.test.ts).
//
// That fixed two real problems: writes to a small, bounded slice (auth,
// ui, a single record) are now flat regardless of what else has
// accumulated elsewhere in the tree, and eventLimit no longer needs to
// re-fold a "snowball" event twice per write.
//
// It did NOT fix, and cannot fix without a fundamentally different data
// structure: writing into a large flat collection (entities.posts with
// thousands of keys) still costs roughly the size of that collection,
// whether you're adding a new key or updating an existing one - because
// `{ ...bigObject, oneKey: value }` is an unavoidable O(size) operation in
// plain JS. This is not unique to this library; Redux/Immer have the same
// characteristic for the same shape of update. eventLimit doesn't change
// this either way - it only ever bounded the event log, not this.
console.log('\nScaling check: writing into ONE large flat map as it grows')
console.log('(this stays expensive regardless of eventLimit - see the comment above)\n')

function scalingRun(label, eventLimit) {
  const s = sacred({ value: { entities: { items: {} } }, eventLimit })
  const BATCH = 200
  const BATCHES = 8
  console.log(`  ${label}:`)
  for (let b = 0; b < BATCHES; b++) {
    const start = process.hrtime.bigint()
    for (let i = 0; i < BATCH; i++) {
      const n = b * BATCH + i
      s.upsert({ key: `entities.items.item-${n}`, value: { id: n } })
    }
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    console.log(
      `    batch ${b}: ${ms.toFixed(1)}ms  (total entities: ${(b + 1) * BATCH}, events: ${s.getEvents().length})`,
    )
  }
}

scalingRun('eventLimit: 0 (unlimited)', 0)
scalingRun('eventLimit: 1000 (default)', undefined)

// --- sacredMerge stress, combineReducers-style ------------------------------
console.log('\nsacredMerge: combining 3 slices, 5000 updates to one of them:')
const authSlice = sacred({ value: initialState.auth })
const uiSlice = sacred({ value: initialState.ui })
const userSlice = sacred({ value: initialState.user })
const combined = sacredMerge([authSlice, uiSlice, userSlice])

let notifications = 0
combined.observe(() => {
  notifications += 1
})

timeIt('  5000 dispatches to uiSlice', () => {
  for (let i = 0; i < 5000; i++) {
    uiSlice.upsert({ key: 'sidebarOpen', value: i % 2 === 0 })
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
  'of that map - an inherent plain-object limitation, not an eventLimit one.',
)
