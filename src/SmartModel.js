
import SmartModelProxy from './SmartModelProxy.js'
import createNested from './createNested.js'
import checkErrors from './checkErrors.js'
import { toArray, keys, merge, isSmartModel, isFn, isArray, isUndef } from './utils.js'

class SmartModel extends SmartModelProxy {
  constructor(schema = {}, data = {}, settings) {
    super(schema, settings)

    keys(schema, (key) => {
      if (isUndef(data[key])) {
        if (!isUndef(schema[key].default)) {
          this[key] = schema[key].default
        } else if (!isFn(schema[key])) {
          this[key] = data[key]
        }
      }
    })

    this.$patch(data)
  }

  // Virtual $get

  $patch(data) {
    keys(data, (key) => {
      this[key] = data[key]
    })
  }

  $post(data) {
    const schema = this.$schema()

    keys(schema, (key) => {
      if (isUndef(data[key])) {
        if (!isUndef(schema[key].default)) {
          this[key] = schema[key].default
        } else if (!isFn(schema[key])) {
          this[key] = data[key]
        }
      } else if (isSmartModel(this[key])) {
        this[key].$put(data[key])
      } else {
        this[key] = data[key]
      }
    })

    keys(data, (key) => {
      this[key] = data[key]
    })
  }

  $put(data) {
    return this.$put(data)
  }

  $delete(properties) {
    toArray(properties).forEach((key) => {
      Reflect.deleteProperty(this, key)
    })
  }

  $subscribe(fn) {
    this.$subscribers().push(fn)

    return () => {
      this.$subscribers(fn)
    }
  }
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
  },
  methods: {
    $onBeforeGet: () => {},
    $onBeforeSet: () => {},
    $onBeforeUpdate: () => {},
    $onDelete: () => {},
    $onGet: () => {},
    $onBeforeDelete: () => {},
    $onSet: () => {},
    $onUpdate: () => {}
  }
}

SmartModel.create = function (name, schema, settings) {
  let subscribers = []

  settings = merge(SmartModel.settings, settings)

  const Model = { [name]: class extends SmartModel {
    constructor(data) {
      super(schema, data, settings)
    }

    $schema() {
      return schema
    }

    $subscribers(removedFn) {
      if (removedFn) {
        subscribers = subscribers.filter((fn) => fn !== removedFn)
      }

      return subscribers
    }

    $applySubscribers(property, value) {
      keys(subscribers, (sub) => {
        Reflect.apply(subscribers[sub], this, [ property, value, this ])
      })
    }
  }
  }[name]

  Model.$check = function (payload = {}, filters) {
    const invalidations = {}

    keys(schema, (property) => {
      let subErrors
      const value = payload[property]
      const entry = schema[property]
      const Nested = createNested(entry, property, settings)

      if (Nested) {
        subErrors = Nested.$check(value, filters)
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

  Model.$hydrate = function (payload) {
    if (isArray(payload)) {
      return payload.map((item) => new Model(item))
    } else {
      return new Model(payload)
    }
  }

  Object.assign(Model.prototype, settings.methods)

  return Model
}

export default SmartModel
