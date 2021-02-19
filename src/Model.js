
import { clone, toArray, isArray, checkErrors } from './utils.js'
import ModelHandler from './ModelHandler.js'

class Model {
  constructor(schema = {}, data = {}) {
    Object.keys(schema).forEach((key) => {
      if (schema[key].default) {
        this[key] = schema[key].default
      }
    })

    this.feed(data)
  }

  feed(data) {
    data = clone(data)

    Object.keys(data).forEach((key) => {
      this[key] = data[key]
    })
  }

  onSet() {}
  onGet() {}
  onDelete() {}
  onUpdate() {}
  onBeforeSet() {}
  onBeforeGet() {}
  onBeforeUpdate() {}
}

Model.settings = {
  strict: false,
  exceptions: true
}

Model.create = function (name, schema, prototype, settings = {}) {
  settings = Object.assign({}, Model.settings, settings)

  const SuperModel = { [name]: class extends Model {
    constructor(data) {
      super(schema)

      return new Proxy(this, new ModelHandler(schema, settings))
    }
  } }[name]

  SuperModel.checkErrors = function (payload, filters) {
    const invalidations = {}

    Object.keys(schema).forEach((property) => {
      const value = payload[property]
      const entry = schema[property]
      let errors = checkErrors(entry, property, value)

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

  SuperModel.hydrate = function (payload) {
    if (isArray(payload)) {
      return payload.map((item) => new SuperModel(item))
    }

    return new SuperModel(payload)
  }

  Object.assign(SuperModel.prototype, prototype)

  return SuperModel
}

export default Model
