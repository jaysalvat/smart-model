
import SmartModelProxy from './SmartModelProxy.js'
import createNested from './createNested.js'
import checkErrors from './checkErrors.js'
import { toArray, isArray, isUndef } from './utils.js'

class SmartModel extends SmartModelProxy {
  constructor(schema = {}, data = {}, settings) {
    super(schema, settings)

    Object.keys(schema).forEach((key) => {
      if (isUndef(data[key])) {
        if (schema[key].default) {
          this[key] = schema[key].default
        } else {
          this[key] = data[key]
        }
      }
    })

    this.feed(data)
  }

  feed(data) {
    Object.keys(data).forEach((key) => {
      this[key] = data[key]
    })
  }

  onBeforeGet() {}
  onBeforeSet() {}
  onBeforeUpdate() {}
  onDelete() {}
  onGet() {}
  onBeforeDelete() {}
  onSet() {}
  onUpdate() {}
}

SmartModel.settings = {
  strict: false,
  exceptions: true
}

SmartModel.create = function (name, schema, settings, prototype) {
  settings = Object.assign({}, SmartModel.settings, settings)

  const Model = { [name]: class extends SmartModel {
    constructor(data) {
      super(schema, data, settings)
    }
  } }[name]

  Model.checkErrors = function (payload, filters) {
    const invalidations = {}

    Object.keys(schema).forEach((property) => {
      let subErrors
      const value = payload[property]
      const entry = schema[property]
      const Nested = createNested(entry, property, settings)

      if (Nested) {
        subErrors = Nested.checkErrors(value, filters)
      }

      let errors = checkErrors(entry, property, value)

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

    return Object.keys(invalidations).length ? invalidations : false
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
