import { keys, isSmartModel, toArray, checkType, isPlainObject } from './utils.js'

export default function checkErrors(entry, property, value, first, settings) {
  const errors = []

  if (settings.strict && (!entry || !keys(entry).length)) {
    errors.push({
      message: `Property "${property}" can't be set in strict mode`,
      code: 'strict'
    })
  }

  if (entry.required && settings.empty(value)) {
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

  if (entry.type && (entry.required || !settings.empty(value))) {
    if (!(isSmartModel(entry.type) && isPlainObject(value))) {
      if (!toArray(entry.type).some((type) => checkType(value, type))) {
        errors.push({
          message: `Property "${property}" has an invalid type "${typeof value}"`,
          code: 'type'
        })
      }
    }
  }

  if (entry.rule) {
    keys(entry.rule, (key) => {
      const rule = entry.rule[key]

      if (rule(value)) {
        errors.push({
          message: `Property "${property}" breaks the "${key}" rule`,
          code: 'rule:' + key
        })
      }
    })
  }

  return errors
}
