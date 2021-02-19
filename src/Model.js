
import { toArray, isArray, checkErrors } from './utils.js'
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

  const ModelClass = { [name]: class extends Model {
    constructor(data) {
      super(schema, data)

      return new Proxy(this, new ModelHandler(schema, settings))
    }
  } }[name]

  ModelClass.checkErrors = function (payload, required) {
    return Model.checkErrors(schema, payload, required)
  }

  Object.assign(ModelClass.prototype, prototype)

  return ModelClass
}

Model.checkErrors = function (schema, payload, filters) {
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

    return
  })

  return Object.keys(invalidations).length ? invalidations : false
}

Model.hydrate = function (ModelToHydrate, payload) {
  if (isArray(payload)) {
    return payload.map((item) => new ModelToHydrate(item))
  }

  return new ModelToHydrate(payload)
}

export default Model
