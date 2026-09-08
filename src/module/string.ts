const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const NUMBER = '0123456789'

type StringRandomOptions = {
  length?: number
  textOnly?: boolean
}

type StringArrayPath = {
  index: number | undefined
  prefix: string
}

// Generate a random string, e.g. for observer ids and event signatures.
export function stringRandom({
  length = 10,
  textOnly = false,
}: StringRandomOptions = {}): string {
  const characters = textOnly ? ALPHABET : `${ALPHABET}${NUMBER}`
  let random = ''

  for (let i = 0; i < length; i++) {
    random += characters[Math.floor(Math.random() * characters.length)]
  }

  return random
}

// Split a path segment like "jedi[1]" into its object key and array index.
export function stringGetArrayPath(input: string): StringArrayPath {
  const bracketIndex = input.indexOf('[')

  if (bracketIndex === -1) {
    return { index: undefined, prefix: input }
  }

  const index = parseInt(input.slice(bracketIndex + 1, -1))

  return {
    index: isNaN(index) ? undefined : index,
    prefix: input.slice(0, bracketIndex),
  }
}
