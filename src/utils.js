/* eslint-disable new-cap */

import SmartModel from './SmartModel.js'

export function isArray(value) {
  return Array.isArray(value)
}

export function isUndef(value) {
  return typeof value === 'undefined'
}

export function isFn(value) {
  return typeof value === 'function'
}

export function isEqual(value1, value2) {
  return JSON.stringify(value1) === JSON.stringify(value2)
}

export function isClass(value) {
  return value && value.toString().startsWith('class')
}

export function isPlainObject(value) {
  return value && value.toString() === '[object Object]'
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

export function merge(source, target) {
  target = Object.assign({}, source, target)

  Object.keys(source).forEach((key) => {
    if (isPlainObject(source[key]) && isPlainObject(target[key])) {
      target[key] = Object.assign({}, source[key], merge(source[key], target[key]))
    }
  })

  return target
}

export function toArray(value) {
  return [].concat([], value)
}

export function eject(target) {
  target = Object.assign({}, target)

  Object.keys(target).forEach((key) => {
    if (target[key] instanceof SmartModel) {
      target[key] = target[key].eject()
    }
  })

  return target
}

export function pascalCase(string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z]+/gi)
    .map((word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    .join('')
}
