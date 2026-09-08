import { isArray, isObject } from './is'
import { stringGetArrayPath } from './string'

type ObjectCreateFromKeyValueInput = {
  key: string
  value: any
}

type ObjectUnsetInput = {
  key: string
  input: object
}

type ObjectSetInput = {
  key: string
  input: object
  value: any
}

export function objectClone(source: any): any {
  if (isArray(source)) {
    const newArray: any[] = []

    for (let item of source) {
      newArray.push(objectClone(item))
    }

    return newArray
  }

  if (isObject(source)) {
    const newObject: Record<string, any> = {}

    for (let key in source) {
      if (source[key] === undefined) continue

      newObject[key] = isObject(source[key])
        ? objectClone(source[key])
        : source[key]
    }

    return newObject
  }

  return source
}

// Build a nested object from a dot/bracket path and a value, e.g.
// { key: 'jedi[1].name', value: 'Yoda' } -> { jedi: [, { name: 'Yoda' }] }
export function objectCreateFromKeyValue({
  key,
  value,
}: ObjectCreateFromKeyValueInput) {
  if (!key) return value

  const keySplit = key.split('.').filter(part => part !== '$')
  const newObject = {}

  keySplit.reduce((obj: any, part: string, index: number) => {
    const { index: arrayIndex, prefix } = stringGetArrayPath(part)

    if (arrayIndex !== undefined) obj[prefix] = []

    if (index === keySplit.length - 1) {
      if (arrayIndex !== undefined) {
        obj[prefix][arrayIndex] = value
        return obj[prefix][arrayIndex]
      }

      obj[part] = value
    } else if (arrayIndex !== undefined) {
      obj[prefix][arrayIndex] = {}
      return obj[prefix][arrayIndex]
    } else {
      obj[part] = {}
    }

    return obj[part]
  }, newObject)

  return newObject
}

export function objectMerge<T = Record<string, any>>(
  source: Record<string, any>,
  target: Record<string, any>,
): T {
  for (let key in target) {
    if (target[key] === undefined) continue

    source[key] = objectReplaceValue(source[key], target[key])
  }

  return source as T
}

function objectReplaceValue(value: any, nextValue: any): any {
  if (isArray(value) && isArray(nextValue)) {
    nextValue.forEach((item: any, index: number) => {
      value[index] = objectReplaceValue(value[index], item)
    })

    return value
  }

  if (isObject(value) && isObject(nextValue)) {
    return objectMerge(value, nextValue)
  }

  return nextValue
}

// Assign `value` at a dot/bracket path within an existing object,
// mutating it in place and creating any missing intermediate structure
// along the way, same path format as objectCreateFromKeyValue, but
// targeting an object that already exists instead of building a fresh
// one. Existing structure along the path (other than the final segment)
// is left untouched, unlike objectMerge, which would recurse into and
// merge an array/object value sitting at the final segment too.
export function objectSet({ key, input, value }: ObjectSetInput) {
  if (!key) return input

  const keySplit = key.split('.').filter(part => part !== '$')

  keySplit.reduce((obj: any, part: string, index: number) => {
    const { index: arrayIndex, prefix } = stringGetArrayPath(part)

    if (arrayIndex !== undefined && obj[prefix] === undefined) {
      obj[prefix] = []
    }

    if (index === keySplit.length - 1) {
      if (arrayIndex !== undefined) {
        obj[prefix][arrayIndex] = value
        return obj[prefix][arrayIndex]
      }

      obj[part] = value
      return obj[part]
    }

    if (arrayIndex !== undefined) {
      if (obj[prefix][arrayIndex] === undefined) obj[prefix][arrayIndex] = {}
      return obj[prefix][arrayIndex]
    }

    if (obj[part] === undefined) obj[part] = {}
    return obj[part]
  }, input)

  return input
}

function objectSetAtPath(obj: any, parts: string[], value: any): any {
  const [part, ...rest] = parts
  const { index: arrayIndex, prefix } = stringGetArrayPath(part)
  const isLast = rest.length === 0

  if (arrayIndex !== undefined) {
    if (prefix.length > 0) {
      const result = { ...obj }
      const array = obj[prefix] ? obj[prefix].slice() : []

      array[arrayIndex] = isLast
        ? value
        : objectSetAtPath(array[arrayIndex], rest, value)

      result[prefix] = array
      return result
    }

    const result = obj ? obj.slice() : []

    result[arrayIndex] = isLast
      ? value
      : objectSetAtPath(result[arrayIndex], rest, value)

    return result
  }

  const result = { ...obj }
  result[part] = isLast ? value : objectSetAtPath(obj[part], rest, value)

  return result
}

export function objectSetImmutable({ key, input, value }: ObjectSetInput): any {
  if (!key) return input

  return objectSetAtPath(input, key.split('.'), value)
}

export function objectUnset({ key, input }: ObjectUnsetInput) {
  if (!key) return input

  const keySplit = key.split('.')

  keySplit.reduce((obj: any, part: string, index: number) => {
    const { index: arrayIndex, prefix } = stringGetArrayPath(part)

    if (index === keySplit.length - 1) {
      if (arrayIndex !== undefined) {
        prefix.length > 0
          ? obj[prefix].splice(arrayIndex, 1)
          : obj.splice(arrayIndex, 1)
      } else {
        delete obj[part]
      }

      return obj
    }

    if (arrayIndex !== undefined) {
      return prefix.length > 0 ? obj[prefix][arrayIndex] : obj[arrayIndex]
    }

    return obj[part]
  }, input)

  return input
}

// Copy-on-write variants: only the objects/arrays along the path being
// written get a new reference. Every untouched sibling branch keeps its
// old reference, so a value returned by an earlier read is never mutated
// by a later write. Use these instead of objectMerge/objectUnset wherever
// the value being updated might already be held by a caller.

export function objectMergeImmutable<T = Record<string, any>>(
  source: Record<string, any>,
  target: Record<string, any>,
): T {
  const result: Record<string, any> = { ...source }

  for (let key in target) {
    if (target[key] === undefined) continue

    result[key] = objectReplaceValueImmutable(result[key], target[key])
  }

  return result as T
}

function objectReplaceValueImmutable(value: any, nextValue: any): any {
  if (isArray(value) && isArray(nextValue)) {
    const result = value.slice()

    nextValue.forEach((item: any, index: number) => {
      result[index] = objectReplaceValueImmutable(result[index], item)
    })

    return result
  }

  if (isObject(value) && isObject(nextValue)) {
    return objectMergeImmutable(value, nextValue)
  }

  return nextValue
}

export function objectUnsetImmutable({ key, input }: ObjectUnsetInput): any {
  if (!key) return input

  return objectUnsetAtPath(input, key.split('.'))
}

function objectUnsetAtPath(obj: any, parts: string[]): any {
  const [part, ...rest] = parts
  const { index: arrayIndex, prefix } = stringGetArrayPath(part)
  const isLast = rest.length === 0

  if (arrayIndex !== undefined) {
    if (prefix.length > 0) {
      const result = { ...obj }
      const array = result[prefix].slice()

      if (isLast) {
        array.splice(arrayIndex, 1)
      } else {
        array[arrayIndex] = objectUnsetAtPath(array[arrayIndex], rest)
      }

      result[prefix] = array
      return result
    }

    const result = obj.slice()

    if (isLast) {
      result.splice(arrayIndex, 1)
    } else {
      result[arrayIndex] = objectUnsetAtPath(result[arrayIndex], rest)
    }

    return result
  }

  if (isLast) {
    const result = { ...obj }
    delete result[part]
    return result
  }

  return { ...obj, [part]: objectUnsetAtPath(obj[part], rest) }
}
