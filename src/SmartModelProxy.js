import { clone, isFn, isEqual } from './utils.js'
import checkErrors from './checkErrors.js'
import SmartModelError from './SmartModelError.js'

class SmartModelProxy {
  constructor(schema = {}, settings = {}) {
    return new Proxy(this, {

      set(target, property, value) {
        const oldValue = clone(target[property])
        const updated = !isEqual(value, oldValue)
        const entry = schema[property]

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, oldValue, schema ])
        }

        if (!entry) {
          if (!settings.strict) {
            target[property] = value
          }

          return true
        }

        trigger(target.onBeforeSet)

        if (updated) {
          trigger(target.onBeforeUpdate)
        }

        if (entry.transform) {
          value = trigger(entry.transform, [ value ])
        }

        if (settings.exceptions) {
          const errors = checkErrors(entry, property, value)

          if (errors.length) {
            errors.forEach((error) => {
              throw new SmartModelError({
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
      },

      get(target, property) {
        const entry = schema[property]
        let value = target[property]

        if (!entry) {
          return target[property]
        }

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, schema ])
        }

        trigger(target.onBeforeGet)

        if (isFn(entry)) {
          value = trigger(entry, [ target ])
        }

        if (isFn(entry.format)) {
          value = trigger(entry.format)
        }

        trigger(target.onGet)

        return value
      },

      deleteProperty(target, property) {
        const value = clone(target[property])
        const entry = schema[property]

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, schema ])
        }

        if (entry.required) {
          throw new SmartModelError({
            message: `Invalid delete on required propery ${property}`,
            property: property,
            code: 'delete'
          })
        }

        Reflect.deleteProperty(target, property)

        trigger(target.onDelete)
        trigger(target.onUpdate)

        return true
      }
    })
  }
}

export default SmartModelProxy
