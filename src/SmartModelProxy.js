import SmartModelError from './SmartModelError.js'
import checkErrors from './checkErrors.js'
import createNested from './createNested.js'
import { keys, eject, isFn, isTypeArrayOfSmartModels, isEqual, isUndef } from './utils.js'

class SmartModelProxy {
  constructor(schema, settings) {
    return new Proxy(this, {
      set(target, property, value) {
        const entry = schema[property] || {}
        const old = target[property]
        const first = isUndef(old)
        const updated = !first && !isEqual(value, old)
        const Nested = createNested(entry, property, settings)

        function trigger(method, args) {
          const returned = Reflect.apply(method, target, args ? args : [ property, value, old, schema ])

          return !isUndef(returned) ? returned : value
        }

        value = trigger(target.$onBeforeSet)

        if (updated) {
          value = trigger(target.$onBeforeUpdate)
        }

        if (isFn(entry.transform)) {
          value = trigger(entry.transform, [ value, schema ])
        }

        if (isTypeArrayOfSmartModels(entry.type)) {
          value = entry.type[0].$hydrate(value)
          entry.type = Array
        }

        const errors = checkErrors(entry, property, value, first, settings)

        if (errors.length) {
          if (settings.exceptions) {
            SmartModelError.throw(settings, errors[0].code, errors[0].message, property, target)
          } else {
            return true
          }
        }

        if (settings.strict && !keys(entry).length) {
          return true
        }

        if (Nested) {
          value = new Nested(value)
        }

        target[property] = value

        trigger(target.$onSet)

        if (updated) {
          trigger(target.$onUpdate)
        }

        return true
      },

      get(target, property) {
        const entry = schema[property]
        let value = target[property]

        if ([ '$get' ].includes(property)) {
          return function () {
            return eject(target)
          }
        }

        if (!entry) {
          return target[property]
        }

        function trigger(method, args) {
          const returned = Reflect.apply(method, target, args ? args : [ property, value, schema ])

          return !isUndef(returned) ? returned : value
        }

        value = trigger(target.$onBeforeGet)

        if (isFn(entry)) {
          value = trigger(entry, [ target, schema ])
        }

        if (isFn(entry.format)) {
          value = trigger(entry.format, [ value, schema ])
        }

        value = trigger(target.$onGet)

        return value
      },

      deleteProperty(target, property) {
        const value = target[property]
        const entry = schema[property] || {}

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, schema ])
        }

        if (entry.required) {
          SmartModelError.throw(settings, 'required', `Property "${property}" is "required"`, property, target)
        }

        trigger(target.$onBeforeDelete)

        Reflect.deleteProperty(target, property)

        trigger(target.$onDelete)
        trigger(target.$onUpdate)

        return true
      }
    })
  }
}

export default SmartModelProxy
