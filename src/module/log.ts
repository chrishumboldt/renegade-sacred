type ColourLogName =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'

const COLOUR_LOG = new Map<ColourLogName, { start: string; end: string }>()
  .set('black', { start: '\x1b[30m', end: '\x1b[39m' })
  .set('red', { start: '\x1b[31m', end: '\x1b[39m' })
  .set('green', { start: '\x1b[32m', end: '\x1b[39m' })
  .set('yellow', { start: '\x1b[33m', end: '\x1b[39m' })
  .set('blue', { start: '\x1b[34m', end: '\x1b[39m' })
  .set('magenta', { start: '\x1b[35m', end: '\x1b[39m' })
  .set('cyan', { start: '\x1b[36m', end: '\x1b[39m' })
  .set('white', { start: '\x1b[37m', end: '\x1b[39m' })
  .set('gray', { start: '\x1b[90m', end: '\x1b[39m' })

export function logColour(prefixColour: ColourLogName, input: any) {
  const colour = COLOUR_LOG.get(prefixColour)

  return `${colour?.start}${input}${colour?.end}`
}

export function sacredLogError(input: string) {
  console.warn(logColour('red', '[SACRED ERROR]'), input)
}
