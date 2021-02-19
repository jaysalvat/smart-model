
export function isEmpty(value) {
  return value === '' || value === null || typeof value === 'undefined'
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

export function checkErrors(entry, property, value) {
  const errors = []

  console.log(entry, value)

  if (entry.required && isEmpty(value)) {
    errors.push({
      message: `Invalid value 'required' on property '${property}'`,
      code: 'required'
    })

    return errors
  }

  if (typeof value === 'undefined') {
    return errors
  }

  if (entry.type) {
    let typeOk
    const types = isArray(entry.type) ? entry.type : [ entry.type ]

    if (!entry.required && isEmpty(value)) {
      typeOk = true
    } else {
      typeOk = types.some((type) => {
        return typeof value === typeof type() || value instanceof type
      })
    }

    if (!typeOk) {
      errors.push({
        message: `Invalid type '${typeof value}' on property '${property}'`,
        code: 'type'
      })
    }
  }

  if (entry.rule) {
    Object.keys(entry.rule).forEach((key) => {
      const rule = entry.rule[key]

      if (rule(value)) {
        errors.push({
          message: `Invalid value '${key}' on property '${property}'`,
          code: key
        })
      }
    })
  }

  return errors
}
