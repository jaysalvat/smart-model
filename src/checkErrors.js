import { isEmpty, toArray, isType } from './utils.js'

export default function checkErrors(entry, property, value) {
  const errors = []

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

  if (entry.type && (entry.required || !isEmpty(value))) {
    if (!toArray(entry.type).some((type) => isType(value, type))) {
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
