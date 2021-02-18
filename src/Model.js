
import { isArray, checkErrors } from './utils.js'
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
  onUpdate() {}
  onBeforeSet() {}
  onBeforeGet() {}
  onBeforeUpdate() {}
}

Model.settings = {
  exceptions: true
}

Model.create = function (type, schema = {}, prototype = {}) {
  const ModelClass = {
    [type]: class extends Model {
      constructor(data) {
        super(schema, data)

        return new Proxy(this, new ModelHandler(schema))
      }
    }
  }

  Object.assign(ModelClass[type].prototype, prototype)

  return ModelClass[type]
}

Model.throwExeptions = function (bool) {
  Model.settings.exeptions = bool
}

Model.checkErrors = function (schema, payload) {
  const invalidations = {}

  Object.keys(schema).forEach((property) => {
    const value = payload[property]
    const entry = schema[property]
    const errors = checkErrors(entry, property, value)

    if (typeof entry === 'function') {
      return
    }

    if (errors.length) {
      invalidations[property] = errors
    }

    return
  })

  return Object.keys(invalidations).length ? invalidations : false
}

Model.hydrate = function (ModelToHydrate, payload) {
  if (isArray(payload)) {
    return payload.map((item) => new ModelToHydrate(item))
  } else {
    return new ModelToHydrate(payload)
  }
}

export default Model
