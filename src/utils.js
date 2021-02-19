
export function isUndef(value) {
  return typeof value === 'undefined'
}

export function isEmpty(value) {
  return value === '' || value === null || isUndef(value)
}

export function isFn(value) {
  return typeof value === 'function'
}

export function isArray(value) {
  return Array.isArray(value)
}

export function isEqual(value1, value2) {
  return JSON.stringify(value1) === JSON.stringify(value2)
}

export function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

export function toArray(value) {
  return [].concat([], value)
}

export function isType(value, type) {
  return typeof value === typeof type() || value instanceof type
}
