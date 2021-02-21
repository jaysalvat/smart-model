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

export function isType(value, Type) {
  if (typeof Type === 'object') {
    Type = Object
  }

  if (!isClass(Type) && typeof value === typeof Type()) {
    return true
  }

  // if (isClass(Type) && typeof value === typeof new Type({}, { exceptions: false })) {
  //   return true
  // }

  if (value instanceof Type || typeof value === typeof Type) {
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
