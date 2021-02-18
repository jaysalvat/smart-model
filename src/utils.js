
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

export function checkErrors(entry, property, value) {
  const errors = []

  if (entry.required) {
    if (isEmpty(value)) {
      errors.push({
        message: `Invalid type 'required' on property '${property}'`,
        type: 'required',
        value: value
      })
    }
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
        type: 'type',
        value: value,
        expected: types
      })
    }
  }

  if (entry.rule) {
    Object.keys(entry.rule).forEach((key) => {
      const rule = entry.rule[key]

      if (!rule(value)) {
        errors.push({
          message: `Invalid value '${key}' on property '${property}'`,
          type: key,
          value: value,
          expected: rule(value)
        })
      }
    })
  }

  return errors
}
