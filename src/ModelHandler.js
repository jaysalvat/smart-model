import { clone, isFn, isEqual, checkErrors } from './utils.js'
import ModelError from './ModelError.js'

class ModelHandler {
  constructor(schema = {}, settings = {}) {
    this.schema = schema
    this.settings = settings
  }

  set(target, property, value) {
    const schema = this.schema
    const oldValue = clone(target[property])
    const updated = !isEqual(value, oldValue)
    let entry = schema[property]

    function trigger(method) {
      return Reflect.apply(method, target, [ property, value, oldValue, schema ])
    }

    if (this.settings.strict && !entry) {
      return true
    } else {
      entry = {}
    }

    if (entry.transform) {
      value = entry.transform(value)
    }

    trigger(target.onBeforeSet)

    if (updated) {
      trigger(target.onBeforeUpdate)
    }

    if (this.settings.exceptions) {
      const errors = checkErrors(entry, property, value)

      if (errors.length) {
        errors.forEach((error) => {
          throw new ModelError({
            message: error.message,
            property: property,
            code: error.code
          })
        })
      }
    }

    target[property] = value

    trigger(target.onSet)

    if (updated) {
      trigger(target.onUpdate)
    }

    return true
  }

  get(target, property) {
    let value = target[property]
    const schema = this.schema
    const entry = schema[property]

    if (!entry) {
      return target[property]
    }

    function trigger(method, args) {
      return Reflect.apply(method, target, args)
    }

    trigger(target.onBeforeGet, [ property, value, schema ])

    if (isFn(entry)) {
      value = trigger(entry, [ target ])
    }

    if (isFn(entry.format)) {
      value = trigger(entry.format, [ value, target ])
    }

    trigger(target.onGet, [ property, value, schema ])

    return value
  }

  deleteProperty(target, property) {
    const value = clone(target[property])
    const schema = this.schema
    const entry = schema[property]
    let undef

    function trigger(method, args) {
      return Reflect.apply(method, target, args)
    }

    if (entry.required) {
      throw new ModelError({
        message: `Invalid delete on required propery ${property}`,
        property: property,
        code: 'delete'
      })
    }

    Reflect.deleteProperty(target, property)

    trigger(target.onDelete, [ property, value, schema ])
    trigger(target.onUpdate, [ property, undef, schema ])

    return true
  }
}

export default ModelHandler
