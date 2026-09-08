export function isArray(check: any): boolean {
  return isObject(check) && check instanceof Array
}

export function isObject(check: any): boolean {
  return typeof check === 'object' && check !== null
}
