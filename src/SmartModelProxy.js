import SmartModelError from './SmartModelError.js'
import checkErrors from './checkErrors.js'
import createNested from './createNested.js'
import { eject, isFn, isEqual, isUndef } from './utils.js'

class SmartModelProxy {
  constructor(schema, settings) {
    let revoked = false

    return new Proxy(this, {
      set(target, property, value) {
        const entry = schema[property] || {}
        const old = target[property]
        const first = isUndef(old)
        const updated = !first && !isEqual(value, old)
        const Nested = createNested(entry, property, settings)

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, old, schema ])
        }

        trigger(target.onBeforeSet)

        if (updated) {
          trigger(target.onBeforeUpdate)
        }

        if (isFn(entry.transform)) {
          value = trigger(entry.transform, [ value, schema ])
        }

        if (settings.exceptions) {
          const errors = checkErrors(entry, property, value, first, settings)

          if (errors.length) {
            SmartModelError.throw(settings, errors[0].code, errors[0].message, property, target)
          }
        }

        if (settings.strict && !Object.keys(entry).length) {
          return true
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

        if (property === 'eject') {
          return function () {
            revoked = true
            const ejection = eject(target)

            revoked = false

            return ejection
          }
        }

        if (revoked) {
          return value
        }

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
