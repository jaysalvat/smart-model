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
    const entry = schema[property]

    function trigger(method) {
      return Reflect.apply(method, target, [ property, value, oldValue, schema ])
    }

    if (!entry) {
      if (!this.settings.strict) {
        target[property] = value
      }

      return true
    }

    trigger(target.onBeforeSet)

    if (updated) {
      trigger(target.onBeforeUpdate)
    }

    if (entry.transform) {
      value = entry.transform(value)
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
    const schema = this.schema
    const entry = schema[property]
    let value = target[property]

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
    const oldValue = clone(target[property])
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

    trigger(target.onDelete, [ property, oldValue, schema ])
    trigger(target.onUpdate, [ property, undef, schema ])

    return true
  }
}

export default ModelHandler
