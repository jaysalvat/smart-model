
/**!
* smartModel
* Javascript object model
* https://github.com/jaysalvat/smart-model
* @version 0.2.2 built 2021-02-19 12:51:57
* @license ISC
* @author Jay Salvat http://jaysalvat.com
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.smartModel = {}));
}(this, (function (exports) { 'use strict';

  function isEmpty(value) {
    return value === '' || value === null || typeof value === 'undefined'
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

    if (entry.type) {
      let typeOk;
      const types = isArray(entry.type) ? entry.type : [ entry.type ];

      if (!entry.required && isEmpty(value)) {
        typeOk = true;
      } else {
        typeOk = types.some((type) => {
          return typeof value === typeof type() || value instanceof type
        });
      }

      if (!typeOk) {
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

  class ModelError extends Error {
    constructor(data) {
      super(data.message);
      Object.assign(this, data);
    }
  }

  class ModelHandler {
    constructor(schema = {}, settings = {}) {
      this.schema = schema;
      this.settings = settings;
    }

    set(target, property, value) {
      const schema = this.schema;
      const oldValue = clone(target[property]);
      const updated = !isEqual(value, oldValue);
      const entry = schema[property];

      function trigger(method) {
        return Reflect.apply(method, target, [ property, value, oldValue, schema ])
      }

      if (!entry) {
        if (!this.settings.strict) {
          target[property] = value;
        }

        return true
      }

      trigger(target.onBeforeSet);

      if (updated) {
        trigger(target.onBeforeUpdate);
      }

      if (entry.transform) {
        value = entry.transform(value);
      }

      if (this.settings.exceptions) {
        const errors = checkErrors(entry, property, value);

        if (errors.length) {
          errors.forEach((error) => {
            throw new ModelError({
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
    }

    get(target, property) {
      const schema = this.schema;
      const entry = schema[property];
      let value = target[property];

      if (!entry) {
        return target[property]
      }

      function trigger(method, args) {
        return Reflect.apply(method, target, args)
      }

      trigger(target.onBeforeGet, [ property, value, schema ]);

      if (isFn(entry)) {
        value = trigger(entry, [ target ]);
      }

      if (isFn(entry.format)) {
        value = trigger(entry.format, [ value, target ]);
      }

      trigger(target.onGet, [ property, value, schema ]);

      return value
    }

    deleteProperty(target, property) {
      const oldValue = clone(target[property]);
      const schema = this.schema;
      const entry = schema[property];
      let undef;

      function trigger(method, args) {
        return Reflect.apply(method, target, args)
      }

      if (entry.required) {
        throw new ModelError({
          message: `Invalid delete on required propery ${property}`,
          property: property,
          code: 'delete'
        })
      }

      Reflect.deleteProperty(target, property);

      trigger(target.onDelete, [ property, oldValue, schema ]);
      trigger(target.onUpdate, [ property, undef, schema ]);

      return true
    }
  }

  class Model {
    constructor(schema = {}, data = {}) {
      Object.keys(schema).forEach((key) => {
        if (schema[key].default) {
          this[key] = schema[key].default;
        }
      });

      this.feed(data);
    }

    feed(data) {
      data = clone(data);

      Object.keys(data).forEach((key) => {
        this[key] = data[key];
      });
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
  };

  Model.create = function (name, schema, prototype, settings = {}) {
    settings = Object.assign({}, Model.settings, settings);

    const SuperModel = { [name]: class extends Model {
      constructor(data) {
        super(schema);

        return new Proxy(this, new ModelHandler(schema, settings))
      }
    } }[name];

    SuperModel.checkErrors = function (payload, filters) {
      const invalidations = {};

      Object.keys(schema).forEach((property) => {
        const value = payload[property];
        const entry = schema[property];
        let errors = checkErrors(entry, property, value);

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

    SuperModel.hydrate = function (payload) {
      if (isArray(payload)) {
        return payload.map((item) => new SuperModel(item))
      }

      return new SuperModel(payload)
    };

    Object.assign(SuperModel.prototype, prototype);

    return SuperModel
  };

  exports.default = Model;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
