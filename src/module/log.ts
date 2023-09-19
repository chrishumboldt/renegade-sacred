import { logColour } from '@renegaderocks/utility'

export function sacredLogError(input: string) {
  console.warn(logColour('red', '[SACRED ERROR]'), input)
}
