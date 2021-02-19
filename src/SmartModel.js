
import { toArray, isArray, isUndef } from './utils.js'
import checkErrors from './checkErrors.js'
import SmartModelProxy from './SmartModelProxy.js'

class SmartModel extends SmartModelProxy {
  constructor(schema = {}, data = {}, settings = {}) {
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

SmartModel.create = function (name, schema, prototype, settings = {}) {
  settings = Object.assign({}, SmartModel.settings, settings)

  const Model = { [name]: class extends SmartModel {
    constructor(data) {
      super(schema, data, settings)
    }
  } }[name]

  Model.checkErrors = function (payload, filters) {
    const invalidations = {}

    Object.keys(schema).forEach((property) => {
      let errors = checkErrors(schema[property], property, payload[property])

      if (errors.length) {
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

  return Model
}

export default SmartModel
