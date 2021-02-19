
/**!
* SmartModel
* Javascript object model
* https://github.com/jaysalvat/smart-model
* @version 0.2.12 built 2021-02-19 22:01:31
* @license ISC
* @author Jay Salvat http://jaysalvat.com
*/
function isUndef(value) {
  return typeof value === 'undefined'
}

function isEmpty(value) {
  return value === '' || value === null || isUndef(value)
}

function isFn(value) {
  return typeof value === 'function'
}

function isArray(value) {
  return Array.isArray(value)
}

function isEqual(value1, value2) {
  return JSON.stringify(value1) === JSON.stringify(value2)
}

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value
}

function toArray(value) {
  return [].concat([], value)
}

function isType(value, type) {
  return typeof value === typeof type() || value instanceof type
}

function checkErrors(entry, property, value) {
  const errors = [];

  if (entry.required && isEmpty(value)) {
    errors.push({
      message: `Invalid value 'required' on property '${property}'`,
      code: 'required'
    });

    return errors
  }

  if (typeof value === 'undefined') {
    return errors
  }

  if (entry.type && (entry.required || !isEmpty(value))) {
    if (!toArray(entry.type).some((type) => isType(value, type))) {
      errors.push({
        message: `Invalid type '${typeof value}' on property '${property}'`,
        code: 'type'
      });
    }
  }

  if (entry.rule) {
    Object.keys(entry.rule).forEach((key) => {
      const rule = entry.rule[key];

      if (rule(value)) {
        errors.push({
          message: `Invalid value '${key}' on property '${property}'`,
          code: key
        });
      }
    });
  }

  return errors
}

class SmartModelError extends Error {
  constructor(data) {
    super(data.message);
    Object.assign(this, data);
  }
}

class SmartModelProxy {
  constructor(schema = {}, settings = {}) {
    return new Proxy(this, {

      set(target, property, value) {
        const oldValue = clone(target[property]);
        const updated = !isEqual(value, oldValue);
        const entry = schema[property];

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, oldValue, schema ])
        }

        if (!entry) {
          if (!settings.strict) {
            target[property] = value;
          }

          return true
        }

        trigger(target.onBeforeSet);

        if (updated) {
          trigger(target.onBeforeUpdate);
        }

        if (entry.transform) {
          value = trigger(entry.transform, [ value, schema ]);
        }

        if (settings.exceptions) {
          const errors = checkErrors(entry, property, value);

          if (errors.length) {
            errors.forEach((error) => {
              throw new SmartModelError({
                message: error.message,
                property: property,
                code: error.code
              })
            });
          }
        }

        target[property] = value;

        trigger(target.onSet);

        if (updated) {
          trigger(target.onUpdate);
        }

        return true
      },

      get(target, property) {
        const entry = schema[property];
        let value = target[property];

        if (!entry) {
          return target[property]
        }

        function trigger(method, args) {
          return Reflect.apply(method, target, args ? args : [ property, value, schema ])
        }

        trigger(target.onBeforeGet);

        if (isFn(entry)) {
          value = trigger(entry, [ target, schema ]);
        }

        if (isFn(entry.format)) {
          value = trigger(entry.format, [ value, schema ]);
        }

        trigger(target.onGet);

        return value
      },

      deleteProperty(target, property) {
        const value = clone(target[property]);
        const entry = schema[property];

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

        trigger(target.onBeforeDelete);

        Reflect.deleteProperty(target, property);

        trigger(target.onDelete);
        trigger(target.onUpdate);

        return true
      }
    })
  }
}

class SmartModel extends SmartModelProxy {
  constructor(schema = {}, data = {}, settings = {}) {
    super(schema, settings);

    Object.keys(schema).forEach((key) => {
      if (isUndef(data[key])) {
        if (schema[key].default) {
          this[key] = schema[key].default;
        } else {
          this[key] = data[key];
        }
      }
    });

    this.feed(data);
  }

  feed(data) {
    Object.keys(data).forEach((key) => {
      this[key] = data[key];
    });
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
};

SmartModel.create = function (name, schema, settings, prototype) {
  settings = Object.assign({}, SmartModel.settings, settings);

  const Model = { [name]: class extends SmartModel {
    constructor(data) {
      super(schema, data, settings);
    }
  } }[name];

  Model.checkErrors = function (payload, filters) {
    const invalidations = {};

    Object.keys(schema).forEach((property) => {
      let errors = checkErrors(schema[property], property, payload[property]);

      if (errors.length) {
        if (filters) {
          errors = errors.filter((error) => !toArray(filters).includes(error.code));
        }

        if (errors.length) {
          invalidations[property] = errors;
        }
      }
    });

    return Object.keys(invalidations).length ? invalidations : false
  };

  Model.hydrate = function (payload) {
    if (isArray(payload)) {
      return payload.map((item) => new Model(item))
    } else {
      return new Model(payload)
    }
  };

  Object.assign(Model.prototype, prototype);

  return Model
};

export default SmartModel;
