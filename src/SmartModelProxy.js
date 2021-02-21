import SmartModelError from './SmartModelError.js'
import checkErrors from './checkErrors.js'
import createNested from './createNested.js'
import { isFn, isEqual } from './utils.js'

class SmartModelProxy {
  constructor(schema, settings) {
    return new Proxy(this, {

      set(target, property, value) {
        let entry = schema[property]
        const old = target[property]
        const updated = !isEqual(value, old)
        const Nested = createNested(entry, property, settings)

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, old, schema ])
        }

        if (!entry) {
          if (settings.strict) {
            return true
          }
          entry = {}
        }

        trigger(target.onBeforeSet)

        if (updated) {
          trigger(target.onBeforeUpdate)
        }

        if (isFn(entry.transform)) {
          value = trigger(entry.transform, [ value, schema ])
        }

        if (settings.exceptions) {
          const errors = checkErrors(entry, property, value)

          if (errors.length) {
            throw new SmartModelError({
              message: errors[0].message,
              property: property,
              code: errors[0].code,
              source: target.constructor.name
            })
          }
        }

        if (Nested) {
          value = new Nested(value instanceof Object ? value : {})
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
          value = trigger(entry, [ target, schema ])
        }

        if (isFn(entry.format)) {
          value = trigger(entry.format, [ value, schema ])
        }

        trigger(target.onGet)

        return value
      },

      deleteProperty(target, property) {
        const value = target[property]
        const entry = schema[property]

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, schema ])
        }

        if (entry.required) {
          throw new SmartModelError({
            message: `Invalid delete on required propery ${property}`,
            property: property,
            code: 'required'
          })
        }

        trigger(target.onBeforeDelete)

        Reflect.deleteProperty(target, property)

        trigger(target.onDelete)
        trigger(target.onUpdate)

        return true
      }
    })
  }
}

export default SmartModelProxy
