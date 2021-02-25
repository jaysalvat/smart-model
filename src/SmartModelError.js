import { isPlainObject } from './utils.js'

class SmartModelError extends Error {
  constructor(data) {
    super(data.message)
    Object.assign(this, data)
  }
}

SmartModelError.throw = function (settings, code, message, property, source) {
  const shortCode = code.split(':')[0]

  source = source && source.constructor.name

  if (settings.exceptions === true || (isPlainObject(settings.exceptions) && settings.exceptions[shortCode])) {
    throw new SmartModelError({
      message: `[${source}] ${message}`,
      source: source,
      property,
      code
    })
  }
}

export default SmartModelError
