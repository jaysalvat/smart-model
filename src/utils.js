/* eslint-disable new-cap */

export function isArray(value) {
  return Array.isArray(value)
}

export function isUndef(value) {
  return typeof value === 'undefined'
}

export function isEmpty(value) {
  return value === '' || value === null || isUndef(value)
}

export function isFn(value) {
  return typeof value === 'function'
}

export function isEqual(value1, value2) {
  return JSON.stringify(value1) === JSON.stringify(value2)
}

export function isClass(value) {
  return value.toString().startsWith('class')
}

export function isPlainObject(value) {
  return value.toString() === '[object Object]'
}

export function isType(value, Type) {
  const match = Type && Type.toString().match(/^\s*function (\w+)/)
  const type = (match ? match[1] : 'object').toLowerCase()

  if (type === 'date' && value instanceof Type) {
    return true
  }

  if (type === 'array' && isArray(value)) {
    return true
  }

  if (type === 'object') {
    if (isClass(Type) && value instanceof Type) {
      return true
    }
    if (!isClass(Type) && typeof value === type) {
      return true
    }
  } else if (typeof value === type) {
    return true
  }

  return false
}

export function toArray(value) {
  return [].concat([], value)
}

export function pascalCase(string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z]+/gi)
    .map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join('')
}
