
import SmartModelProxy from './SmartModelProxy.js'
import createNested from './createNested.js'
import checkErrors from './checkErrors.js'
import { toArray, isSmartModel, keys, merge, isArray, isUndef } from './utils.js'

/**
 * #TODO: Hydrate nested
 * @TODO: Stop set in exceptions
 */

class SmartModel extends SmartModelProxy {
  constructor(schema = {}, data = {}, settings) {
    super(schema, settings)

    keys(schema, (key) => {
      if (isUndef(data[key])) {
        if (!isUndef(schema[key].default)) {
          this[key] = schema[key].default
        } else {
          this[key] = data[key]
        }
      }
    })

    this.$patch(data)
  }

  $patch(data) {
    keys(data, (key) => {
      this[key] = data[key]
    })
  }

  $put(data) {
    keys(this, (key) => {
      if (data[key]) {
        if (isSmartModel(this[key])) {
          this[key].$put(data[key])
        } else {
          this[key] = data[key]
        }
      } else {
        this.$delete(key)
      }
    })

    keys(data, (key) => {
      if (!this[key]) {
        this[key] = data[key]
      }
    })
  }

  $delete(properties) {
    toArray(properties).forEach((key) => {
      Reflect.deleteProperty(this, key)
    })
  }

  $onBeforeGet() {}
  $onBeforeSet() {}
  $onBeforeUpdate() {}
  $onDelete() {}
  $onGet() {}
  $onBeforeDelete() {}
  $onSet() {}
  $onUpdate() {}
}

SmartModel.settings = {
  empty: (value) => value === '' || value === null || isUndef(value),
  strict: false,
  exceptions: {
    readonly: false,
    required: true,
    rule: true,
    strict: false,
    type: true
  }
}

SmartModel.create = function (name, schema, settings, prototype) {
  settings = merge(SmartModel.settings, settings)

  const Model = { [name]: class extends SmartModel {
    constructor(data) {
      super(schema, data, settings)
    }
  } }[name]

  Model.checkErrors = function (payload, filters) {
    const invalidations = {}

    keys(schema, (property) => {
      let subErrors
      const value = payload[property]
      const entry = schema[property]
      const Nested = createNested(entry, property, settings)

      if (Nested) {
        subErrors = Nested.checkErrors(value, filters)
      }

      let errors = checkErrors(entry, property, value, false, settings)

      if (subErrors) {
        invalidations[property] = subErrors
      } else if (errors.length) {
        if (filters) {
          errors = errors.filter((error) => !toArray(filters).includes(error.code))
        }

        if (errors.length) {
          invalidations[property] = errors
        }
      }
    })

    return keys(invalidations).length ? invalidations : false
  }

  Model.hydrate = function (payload) {
    if (isArray(payload)) {
      return payload.map((item) => new Model(item))
    } else {
      return new Model(payload)
    }
  }

  Object.assign(Model.prototype, prototype)

  Model.schema = schema

  return Model
}

export default SmartModel
