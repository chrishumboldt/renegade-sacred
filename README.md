# Renegade Sacred

Sacreds are a way of implementing immutability within an application and deriving value at runtime. If we take the age old story, mutability is perfectly fine in small short lived applications, but in reality this is never the case. As time goes by applications get bigger and the lifecycle of the internal application state changes dramatically. At startup we declare a variable `myVar` with the value `Gemma Rocks`. By the time some function uses that variable it has mutated into `Star Wars Now Sucks`. This mutation might be unexpected, maybe even unwanted. Perhaps some code somewhere has accidentally referenced it and as a result changed the value without meaning to.

It is in this case that the idea of immutability has become popular. The principle is fine. Create a value and never change it. So now when I use said value I can always guarantee that it is reliable. This however creates another problem. If I want an alternative version of the value I need to "copy" said value. I now have a new memory reference. In a big application things will get copied a lot and now size and memory become a factor. Plus what happens if my immutable variable is a list of a million entries and I want to change one index. Well I need to copy the 1 million list again and change one thing. I now have two 1 million item lists.

This has been solved with other solutions by creating change trees, where when I copy the immutable item, I am actually just copying the change. So now when I read that value I actually read the immutable base reference and just apply the change. In a way this is a "derived" value over an "absolute" value. This pattern shows up constantly in event-sourced systems, where the entire architecture is technically immutable since events represent change over time.

With this in mind Sacreds are a new way to treat immutable "things" without having to redeclare the variable when wanting change. The original value always remains intact and if you wish to change this value, you have to upsert it. This in turn creates an event within the Sacred and thus allows an aggregation of the Sacred value. This value is then derived and not absolute and whats best, is the same variable reference can be passed around.

Another benefit of Sacreds is while most immutable solutions require an assignment, we do not have a direct link to the original variable. Only the previous leaf node of change. With a sacred, the same variable reference gets passed around which in turn allows us to get the original value whenever we want. Plus we are also able to "time travel" within the sacred thing and thus have access to the entire history of change.

One more bonus is the fact that types are adhered to. In javascript we can change the type of a value since it is dynamically typed. Sacreds prevent this as new values **MUST MATCH THE TYPE** else it will not create an event of change. You will also see an error in the console warnings tab if you try. Since `sacred()` infers its type from the value you give it, TypeScript will catch a mismatched whole-value upsert (`sacredThing.upsert({ value: ... })`) at compile time too, not just at runtime. This only applies when you upsert the whole value. Upserting via a key path (`sacredThing.upsert({ key: 'attributes.age', value: ... })`) targets a nested slice of the value, which isn't practically type-checkable against a string path, so it stays loosely typed.

- [Using a Sacred](#using-a-sacred)
- [Sacred Change Only](#sacred-change-only)
- [Sacred Functions](#sacred-functions)
- [Sacred Arrays](#sacred-arrays)
- [Sacred Auto Aggregation](#sacred-auto-aggregation)
- [Sacred Ledger](#sacred-ledger)
- [Sacred Merge](#sacred-merge)
- [Sacred Objects](#sacred-objects)
- [Sacred Observers](#sacred-observers)
- [Sacred Persist](#sacred-persist)
- [Sacred Revert](#sacred-revert)
- [Sacred Select](#sacred-select)
- [Sacred Side Effects](#sacred-side-effects)
- [Sacred Signature](#sacred-signature)
- [Sacred Unset](#sacred-unset)

#### Using a Sacred

Creating a sacred is very simple and can accept the types `boolean`, `number`, `object` and `string`.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: 'Anakin Skywalker' })
```

Now if we want to change the value (mutate without actually mutating), we simply upsert the sacred.

```javascript
sacredThing.upsert({ value: 'Darth Vader' })

sacredThing.getValue() // Darth Vader
```

#### Sacred Change Only

You can limit upsert events to only when the event is different to its previous event. By default this is set to `false`.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: 'Anakin Skywalker', changeOnly: true })

sacredThing.upsert({ value: 'Anakin Skywalker' })
sacredThing.upsert({ value: 'Anakin Skywalker' })
sacredThing.upsert({ value: 'Anakin Skywalker' })
sacredThing.upsert({ value: 'Anakin Skywalker' })
sacredThing.upsert({ value: 'Darth Vader' })

sacredThing.getEvents().length // Only going to be 2
sacredThing.getValue() // Darth Vader
```

By default `changeOnly` compares by reference equality, which works well for primitives but rarely dedupes objects or arrays (a new literal is almost never `===` the previous one, even with identical contents). Pass a comparator function instead if you need real dedupe for those.

```javascript
const sacredThing = sacred({
  value: { id: 1 },
  changeOnly: (previousValue, nextValue) => previousValue.id === nextValue.id,
})

sacredThing.upsert({ value: { id: 1 } }) // applied (first write always applies)
sacredThing.upsert({ value: { id: 1 } }) // ignored, same id as the previous event
sacredThing.upsert({ value: { id: 2 } }) // applied
```

#### Sacred Functions

| Function                                          | Description                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `sacred(options)`                                 | Create a sacred thing.                                                  |
| `[sacredRef].collapseEvents()`                    | Collapse all the events in the event history into one aggregated event. |
| `[sacredRef].getEvents()`                         | Get all the events for the sacred thing.                                |
| `[sacredRef].getObserverCount()`                  | Get the amount of observers currently reacting to the sacred thing.     |
| `[sacredRef].getOptions()`                        | Get all the options for the sacred thing.                               |
| `[sacredRef].getOriginalValue()`                  | Get the sacred thing original value.                                    |
| `[sacredRef].getValue()`                          | Get the sacred thing aggregated value.                                  |
| `[sacredRef].getValueType()`                      | Get the sacred thing value type.                                        |
| `[sacredRef].logLedger()`                         | Log out the sacred thing ledger to the console.                         |
| `[sacredRef].observe(function, triggerOnObserve)` | Observe a sacred thing and react to the events.                         |
| `[sacredRef].revert(steps)`                       | Undo the last `steps` events (default `1`).                             |
| `[sacredRef].unset(options)`                      | Unset something on a sacred thing.                                      |
| `[sacredRef].upsert(options)`                     | Upsert a sacred thing with a new event.                                 |

#### Sacred Arrays

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: ['Ani', 'Padawan Skywalker'] })

// Upsert the array with a new value.
sacredThing.upsert({ value: ['Jedi Knight Skywalker'] })

sacredThing.getValue() // ['Ani', 'Padawan Skywalker', 'Jedi Knight Skywalker']
```

When a new array is upserted the arrays go through an aggregation and get merged. If you want instead to replace an array at a key you can do so but note that you require just the value and not an array.

```javascript
sacredThing.upsert({ key: 0, value: 'Young Ani' })

sacredThing.getValue() // ['Young Ani', 'Padawan Skywalker', 'Jedi Knight Skywalker']
```

#### Sacred Auto Aggregation

If a sacred is being used a lot there is a chance that the event history becomes so large that memory will start to overload. In the event that a sacred is actually causing slow down, you can auto aggregate the events so the history never grows unbounded. This means that events will always be limited at a certain point. This does add processing to the Sacred but reduces memory space used.

By default the event limit is `1000`, so this happens automatically without you having to think about it. Pass `eventLimit: 0` if you want a sacred with no limit at all.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({
  value: 'Ani',
  eventLimit: 3,
})

sacredThing.upsert({ value: 'Padawan Skywalker' })
sacredThing.upsert({ value: 'Jedi Knight Skywalker' })
sacredThing.upsert({ value: 'Sith Lord Darth Vader' })
sacredThing.upsert({ value: 'Luke Skywalkers Dad Again' })
sacredThing.upsert({ value: 'Dead Guy' })
sacredThing.upsert({ value: 'Force Ghost' })

sacredThing.logLedger()
```

This results in:

```bash
Original Value
Ani

Events
┌─────────┬───────────────────────────────────┬──────────┬─────────────────────────────┐
│ (index) │             metadata              │   type   │            value            │
├─────────┼───────────────────────────────────┼──────────┼─────────────────────────────┤
│    0    │ { eventTimestamp: 1668311804214 } │ 'upsert' │ 'Luke Skywalkers Dad Again' │
│    1    │ { eventTimestamp: 1668311804214 } │ 'upsert' │         'Dead Guy'          │
│    2    │ { eventTimestamp: 1668311804214 } │ 'upsert' │        'Force Ghost'        │
└─────────┴───────────────────────────────────┴──────────┴─────────────────────────────┘

Value
Force Ghost
```

As you can see the event history has been dramatically reduced. In the event of arrays and objects they will be merged as with all aggregations and no data will be lost. It remains perfectly accurate.

#### Sacred Ledger

The ledger is an aethereal concept within a sacred of a list of changes, the current value and the original value. You can log this ledger out by running the following function.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: 'Ani' })

sacredThing.upsert({ value: 'Padawan Skywalker' })
sacredThing.upsert({ value: 'Jedi Knight Skywalker' })
sacredThing.upsert({ value: 'Sith Lord Darth Vader' })

sacredThing.logLedger()
```

This results in:

```bash
Original Value
Ani

Events
┌─────────┬───────────────────────────────────┬──────────┬─────────────────────────┐
│ (index) │             metadata              │   type   │          value          │
├─────────┼───────────────────────────────────┼──────────┼─────────────────────────┤
│    0    │ { eventTimestamp: 1668311114988 } │ 'upsert' │   'Padawan Skywalker'   │
│    1    │ { eventTimestamp: 1668311114988 } │ 'upsert' │ 'Jedi Knight Skywalker' │
│    2    │ { eventTimestamp: 1668311114988 } │ 'upsert' │ 'Sith Lord Darth Vader' │
└─────────┴───────────────────────────────────┴──────────┴─────────────────────────┘

Value
Sith Lord Darth Vader
```

#### Sacred Merge

Sometimes you have several independent sacreds and want a single place to react to any of them changing, without wiring up your own observers for each one. `sacredMerge` combines an array of sacreds into one derived value: an array whose items line up positionally with the sacreds you passed in, and which stays in sync automatically.

```javascript
import { sacred, sacredMerge } from '@renegaderocks/sacred'

const sacredName = sacred({ value: 'Ani' })
const sacredAge = sacred({ value: 9 })

const merged = sacredMerge([sacredName, sacredAge])

merged.observe(value => {
  console.log('Value:', value)
})
// Value: [ 'Ani', 9 ]

sacredName.upsert({ value: 'Darth Vader' })
// Value: [ 'Darth Vader', 9 ]
```

Just like a regular sacred, `observe` can be called more than once. Each call is its own independent subscription, and unobserving one doesn't affect the others.

```javascript
const merged = sacredMerge([sacredName, sacredAge])

const subscriberOne$ = merged.observe(value => console.log('One:', value))
// One: [ 'Ani', 9 ]
const subscriberTwo$ = merged.observe(value => console.log('Two:', value))
// Two: [ 'Ani', 9 ]

subscriberOne$.unobserve()

sacredName.upsert({ value: 'Darth Vader' })
// Two: [ 'Darth Vader', 9 ]
// (subscriberOne$ hears nothing, it already unobserved)
```

`sacredMerge` takes the same options as `sacred` (minus `value`, since that's always the merged array) as a second argument, which are applied to the merge's internally derived sacred. This is most useful for `eventLimit`, since a merge that reacts to frequently-changing sacreds accumulates events just like any other sacred.

```javascript
const merged = sacredMerge([sacredName, sacredAge], { eventLimit: 500 })
```

#### Sacred Objects

Much like arrays sacred objects can be upserted in a variety of ways.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({
  value: {
    name: 'Ani',
    attributes: {
      affiliation: 'citizen',
      age: 9,
      lightsaber: false,
    },
  },
})
```

With the above sacred we can upsert either with an object or a key. In both cases the objects are merged over each other when being aggregated.

```javascript
sacredThing.upsert({ value: { name: 'Padawan Skywalker' } })

sacredThing.getValue()
```

```json
{
  "name": "Padawan Skywalker",
  "attributes": {
    "affiliation": "citizen",
    "age": 9,
    "lightsaber": false
  }
}
```

```javascript
sacredThing.upsert({
  value: {
    attributes: {
      affiliation: 'Jedi',
      age: 18,
    },
  },
})

sacredThing.getValue()
```

```json
{
  "name": "Padawan Skywalker",
  "attributes": {
    "affiliation": "Jedi",
    "age": 18,
    "lightsaber": false
  }
}
```

Next lets update by using a key.

```javascript
sacredThing.upsert({ key: 'attributes.lightsaber', value: true })

sacredThing.getValue()
```

```json
{
  "name": "Padawan Skywalker",
  "attributes": {
    "affiliation": "Jedi",
    "age": 18,
    "lightsaber": true
  }
}
```

You can also update object arrays with a key. For example.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({
  value: {
    type: 'Jedi',
    jedi: [
      { name: 'Obi-Wan Kenobi', lightsaberColour: 'blue' },
      { name: 'Yoda', lightsaberColour: 'green' },
    ],
  },
})

sacredThing.upsert({ key: 'jedi[0].name', value: 'Qui-Gon Jinn' })

sacredThing.getValue()
```

```json
{
  "type": "Jedi",
  "jedi": [
    { "name": "Qui-Gon Jinn", "lightsaberColour": "blue" },
    { "name": "Yoda", "lightsaberColour": "green" }
  ]
}
```

```javascript
sacredThing.upsert({ key: 'jedi[2].name', value: 'Mace Windu' })

sacredThing.getValue()
```

```json
{
  "type": "Jedi",
  "jedi": [
    { "name": "Qui-Gon Jinn", "lightsaberColour": "blue" },
    { "name": "Yoda", "lightsaberColour": "green" },
    { "name": "Mace Windu" }
  ]
}
```

#### Sacred Observers

It is possible to observe a sacred thing and react to its change. The observer pattern is very limited at this point but can be very powerful.

```javascript
import { sacred } from '@renegaderocks/sacred'
import type { SacredEffect } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: 'Ani' })

// You can then observe the sacred.
const sacredObserver$ = sacredThing.observe((event: SacredEffect) => {
  const { events, originalValue, value } = event

  console.log('Value:', value)
})
// Value: Ani

sacredThing.upsert({ value: 'Padawan Anakin Skywalker' })
// Value: Padawan Anakin Skywalker

sacredThing.upsert({ value: 'Darth Vader' })
// Value: Darth Vader
```

You can see how many observers there are at any time.

```javascript
console.log(sacredThing.getObserverCount())
// 1
```

You can see the internal id of your observer.

```javascript
sacredObserver$.getObserverId()
```

You can also release your observer by running the "unobserve" function.

```javascript
sacredObserver$.unobserve()
```

If one of your observers throws, it won't stop the others from being notified. The error is caught, logged as a `[SACRED ERROR]` to the console, and the rest of the observers still run. The one exception is the immediate call an observer gets when it's first registered (see `triggerOnObserve` below). That one runs synchronously as part of your own `observe()` call, so a throw there surfaces straight back to you rather than being swallowed.

If you don't want your function to run immediately on observation just set the `triggerOnObserve` to `false`.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: 'Ani' })

const sacredObserver$ = sacredThing.observe(() => {
  console.log('Event happened!')
}, false)

sacredThing.upsert({ value: 'Padawan Anakin Skywalker' })
// Event happened!
```

#### Sacred Persist

Since a sacred is just an original value plus an event history, it's already JSON-safe to reconstruct: `sacred()` accepts an `events` array to rebuild its history from. `sacredSerialize`/`sacredHydrate` make that round-trip explicit.

```javascript
import { sacred, sacredHydrate, sacredSerialize } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: { name: 'Ani' } })
sacredThing.upsert({ key: 'name', value: 'Darth Vader' })

// Save it anywhere JSON.stringify can go, such as localStorage, a file, or a DB row.
const saved = JSON.stringify(sacredSerialize(sacredThing))

// ...later, possibly in a different process...
const restored = sacredHydrate(JSON.parse(saved))

restored.getValue() // { name: 'Darth Vader' }
```

`sacredHydrate` takes the same options as `sacred` (`eventLimit`, `changeOnly`, etc.) as an optional second argument, so a hydrated sacred behaves exactly like the original going forward. Where to actually store the serialized data is left up to you. Sacred has no opinion on localStorage vs. a database vs. anything else.

#### Sacred Revert

Because a sacred's value is derived from its event history, undoing a change is just dropping the most recent events and recomputing.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: { age: 9 } })

sacredThing.upsert({ key: 'age', value: 10 })
sacredThing.upsert({ key: 'age', value: 11 })

sacredThing.revert() // undoes age: 11
sacredThing.getValue() // { age: 10 }

sacredThing.revert(2) // undoes the write before it too
sacredThing.getValue() // { age: 9 }
```

`revert` cannot cross an `eventLimit` auto-aggregation boundary (see [Sacred Auto Aggregation](#sacred-auto-aggregation)). Once older events have been collapsed into one synthetic aggregate event, the individual steps inside that collapse are gone for good. You can revert back to the collapsed aggregate, but not to a state that only existed in between.

#### Sacred Select

`sacredSelect` derives a value from a sacred and only notifies its observers when the *selected* slice actually changes, not on every change to the source. This is cheap because of structural sharing: writing to one branch of a sacred object never touches the reference of an untouched sibling branch, so a selector comparing by reference can tell at a glance whether its slice was affected.

```javascript
import { sacred, sacredSelect } from '@renegaderocks/sacred'

const appState = sacred({
  value: { ui: { sidebarOpen: false }, auth: { token: 'a' } },
})

const uiState = sacredSelect(appState, state => state.ui)

uiState.observe(ui => {
  console.log('UI:', ui)
})
// UI: { sidebarOpen: false }

appState.upsert({ key: 'auth.token', value: 'b' })
// (nothing logged, since auth isn't part of the selection)

appState.upsert({ key: 'ui.sidebarOpen', value: true })
// UI: { sidebarOpen: true }
```

By default a selector's change detection uses reference equality (`Object.is`). If your selector builds a new object or array on every call (so it would never be reference-equal even when "the same"), pass a custom `isEqual`.

```javascript
const idOnly = sacredSelect(appState, state => ({ id: state.id }), {
  isEqual: (a, b) => a.id === b.id,
})
```

`sacredSelect` is a free function that takes a sacred, the same way `sacredMerge` does. It is not a method on `Sacred` itself, since it builds a new derived thing rather than operating on the sacred it's given.

#### Sacred Side Effects

When an event is added into the ledger, you can trigger off one or more side effect functions. With each side effect you have access to the entire ledger which includes the `events` history (The last entry being the event that triggered the side effect), the `originalValue` and the current `value`.

**NOTE** that these side effects exist for the entire lifespan of the sacred and will always run. If one side effect throws, it's caught and logged rather than stopping the other side effects (or observers) from running.

See an example of it in use below.

```javascript
import { sacred } from '@renegaderocks/sacred'
import type { SacredEffect } from '@renegaderocks/sacred'

// The side effect.
const logOutEverything = ({
  events,
  originalValue,
  value,
}: SacredEffect) => {
  console.log('Trigger Event:', events[events.length - 1])
  console.log('Events:', events)
  console.log('Original Value:', originalValue)
  console.log('Value:', value)
}

// Create the sacred thing with a side effect.
const sacredThing = sacred({
  value: 'Ani',
  sideEffect: [logOutEverything],
})

// Added an event to the thing.
sacredThing.upsert({ value: 'Padawan Anakin Skywalker' })
/*
Trigger Event: {
  metadata: { eventTimestamp: 1668756156868 },
  type: 'upsert',
  value: 'Padawan Anakin Skywalker'
}
Events: [
  {
    metadata: { eventTimestamp: 1668756156868 },
    type: 'upsert',
    value: 'Padawan Anakin Skywalker'
  }
]
Original Value: Ani
Value: Padawan Anakin Skywalker
*/

// Added another event to the thing.
sacredThing.upsert({ value: 'Darth Vader' })
/*
Trigger Event: {
  metadata: { eventTimestamp: 1668756156872 },
  type: 'upsert',
  value: 'Darth Vader'
}
Events: [
  {
    metadata: { eventTimestamp: 1668756156868 },
    type: 'upsert',
    value: 'Padawan Anakin Skywalker'
  },
  {
    metadata: { eventTimestamp: 1668756156872 },
    type: 'upsert',
    value: 'Darth Vader'
  }
]
Original Value: Ani
Value: Darth Vader
*/
```

#### Sacred Signature

Any event added to the ledger can be "signed" in order to give the consumer of the ledger clarity into what caused the change.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({ value: 'Anakin Skywalker' })

// Upsert with a signature.
sacredThing.upsert({
  value: 'Jedi Knight Skywalker',
  signature: 'someFunctionName()',
})
sacredThing.upsert({
  value: 'Darth Vader',
  signature: 'someOtherFunctionName()',
})

sacredThing.logLedger()
```

This results in:

```bash
Original Value
Anakin Skywalker

Events
┌─────────┬─────────────────────────────────────────────────────────────────────────┬──────────┬─────────────────────────┐
│ (index) │                                metadata                                 │   type   │          value          │
├─────────┼─────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────────────┤
│    0    │   { eventTimestamp: 1668998550015, signature: 'someFunctionName()' }    │ 'upsert' │ 'Jedi Knight Skywalker' │
│    1    │ { eventTimestamp: 1668998550015, signature: 'someOtherFunctionName()' } │ 'upsert' │      'Darth Vader'      │
└─────────┴─────────────────────────────────────────────────────────────────────────┴──────────┴─────────────────────────┘

Value
Darth Vader
```

#### Sacred Unset

You can unset values inside a sacred thing be it a property or an entire array item.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({
  value: {
    name: 'Ani',
    attributes: {
      age: 9,
      lightsaber: false,
    },
  },
})

// Lets add a property to create an event log.
sacredThing.upsert({ key: 'attributes.affiliation', value: 'citizen' })

// Now lets unset a property.
sacredThing.unset({ key: 'attributes.age' })

sacredThing.logLedger()
```

This results in:

```bash
Original Value
{ name: 'Ani', attributes: { age: 9, lightsaber: false } }

Events
┌─────────┬───────────────────────────────────┬──────────┬──────────────────────────┐
│ (index) │             metadata              │   type   │          value           │
├─────────┼───────────────────────────────────┼──────────┼──────────────────────────┤
│    0    │ { eventTimestamp: 1668332707508 } │ 'upsert' │ { attributes: [Object] } │
│    1    │ { eventTimestamp: 1668332707508 } │ 'unset'  │     'attributes.age'     │
└─────────┴───────────────────────────────────┴──────────┴──────────────────────────┘

Value
{
  name: 'Ani',
  attributes: { lightsaber: false, affiliation: 'citizen' }
}
```

You can also unset an array.

```javascript
import { sacred } from '@renegaderocks/sacred'

const sacredThing = sacred({
  value: [
    { name: 'Yoda', lightsaberColour: 'green' },
    { name: 'Obi-Wan Kenobi', lightsaberColour: 'blue' },
    { name: 'Qui-Gon Jin', lightsaberColour: 'green' },
  ],
})

sacredThing.unset({ key: '[0].name' }) // Remove a property from an array item.
sacredThing.unset({ key: '[1]' }) // Remove an entire array element. This runs a splice.

sacredThing.logLedger()
```

This results in:

```bash
Original Value
[
  { name: 'Yoda', lightsaberColour: 'green' },
  { name: 'Obi-Wan Kenobi', lightsaberColour: 'blue' },
  { name: 'Qui-Gon Jin', lightsaberColour: 'green' }
]

Events
┌─────────┬───────────────────────────────────┬─────────┬────────────┐
│ (index) │             metadata              │  type   │   value    │
├─────────┼───────────────────────────────────┼─────────┼────────────┤
│    0    │ { eventTimestamp: 1668333077120 } │ 'unset' │ '[0].name' │
│    1    │ { eventTimestamp: 1668333077120 } │ 'unset' │   '[1]'    │
└─────────┴───────────────────────────────────┴─────────┴────────────┘

Value
[
  { lightsaberColour: 'green' },
  { name: 'Qui-Gon Jin', lightsaberColour: 'green' }
]
```
