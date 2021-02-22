import { isEmpty, toArray, isType } from './utils.js'

export default function checkErrors(entry, property, value, first) {
  const errors = []

  if (entry.required && isEmpty(value)) {
    errors.push({
      message: `Property "${property}" is "required"`,
      code: 'required'
    })

    return errors
  }

  if (entry.readonly && !first) {
    errors.push({
      message: `Property '${property}' is 'readonly'`,
      code: 'readonly'
    })

    return errors
  }

  if (typeof value === 'undefined') {
    return errors
  }

  if (entry.type && (entry.required || !isEmpty(value))) {
    if (!toArray(entry.type).some((type) => isType(value, type))) {
      errors.push({
        message: `Property "${property}" has an invalid type "${typeof value}"`,
        code: 'type'
      })
    }
  }

  if (entry.rule) {
    Object.keys(entry.rule).forEach((key) => {
      const rule = entry.rule[key]

      if (rule(value)) {
        errors.push({
          message: `Property "${property}" breaks the "${key}" rule`,
          code: key
        })
      }
    })
  }

  return errors
}
