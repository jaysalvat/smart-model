
import SmartModelProxy from './SmartModelProxy.js'
import createNested from './createNested.js'
import checkErrors from './checkErrors.js'
import { toArray, keys, merge, isArray, isUndef } from './utils.js'

class SmartModel extends SmartModelProxy {
  constructor(schema = {}, data = {}, settings) {
    super(schema, settings)

    this.$post(data)
  }

  // Virtual $get

  $patch(data) {
    keys(data, (key) => {
      this[key] = data[key]
    })
  }

  $post(data) {
    let undef
    const schema = this.$schema()

    keys(schema, (key, value) => {
      if (isUndef(data[key])) {
        if (!isUndef(value.default)) {
          this[key] = value.default
        } else {
          this[key] = undef
        }
      }
    })

    keys(this, (key, value) => {
      if (isUndef(schema[key] && isUndef(value))) {
        this.$delete(key)
      }
    })

    this.$patch(data)
  }

  $put(data) {
    return this.$post(data)
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
      keys(subscribers, (_, subscriber) => {
        Reflect.apply(subscriber, this, [ property, value, this ])
      })
    }
  }
  }[name]

  Model.$check = function (payload = {}, filters) {
    const invalidations = {}

    keys(schema, (property, entry) => {
      let subErrors
      const value = payload[property]
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
