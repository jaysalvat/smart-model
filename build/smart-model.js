/**!
* SmartModel
* Javascript object model
* https://github.com/jaysalvat/smart-model
* @version 0.3.4 built 2021-02-23 18:42:31
* @license ISC
* @author Jay Salvat http://jaysalvat.com
*/
var SmartModel = function() {
  "use strict";
  function isArray(value) {
    return Array.isArray(value);
  }
  function isUndef(value) {
    return typeof value === "undefined";
  }
  function isFn(value) {
    return typeof value === "function";
  }
  function isEqual(value1, value2) {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }
  function isClass(value) {
    return value && value.toString().startsWith("class");
  }
  function isSmartModel(value) {
    return value.prototype instanceof SmartModel || value instanceof SmartModel;
  }
  function isPlainObject(value) {
    return value && value.toString() === "[object Object]";
  }
  function keys(obj, cb = function() {}) {
    return Object.keys(obj).map(cb);
  }
  function toArray(value) {
    return [].concat([], value);
  }
  function merge(source, target) {
    target = Object.assign({}, source, target);
    keys(source, (key => {
      if (isPlainObject(source[key]) && isPlainObject(target[key])) {
        target[key] = Object.assign({}, source[key], merge(source[key], target[key]));
      }
    }));
    return target;
  }
  function eject(target) {
    target = Object.assign({}, target);
    keys(target, (key => {
      if (isSmartModel(target[key])) {
        target[key] = target[key].$eject();
      }
    }));
    return target;
  }
  function pascalCase(string) {
    return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z1-9]+/gi).map((word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())).join("");
  }
  function checkType(value, Type) {
    const match = Type && Type.toString().match(/^\s*function (\w+)/);
    const type = (match ? match[1] : "object").toLowerCase();
    if (type === "date" && value instanceof Type) {
      return true;
    }
    if (type === "array" && isArray(value)) {
      return true;
    }
    if (type === "object") {
      if (isClass(Type) && value instanceof Type) {
        return true;
      }
      if (!isClass(Type) && typeof value === type) {
        return true;
      }
    } else if (typeof value === type) {
      return true;
    }
    return false;
  }
  class SmartModelError extends Error {
    constructor(data) {
      super(data.message);
      Object.assign(this, data);
    }
  }
  SmartModelError.throw = function(settings, code, message, property, source) {
    const shortCode = code.split(":")[0];
    if (settings.exceptions === true || isPlainObject(settings.exceptions) && settings.exceptions[shortCode]) {
      throw new SmartModelError({
        message: message,
        property: property,
        code: code,
        source: source && source.constructor.name
      });
    }
  };
  function checkErrors(entry, property, value, first, settings) {
    const errors = [];
    if (settings.strict && (!entry || !keys(entry).length)) {
      errors.push({
        message: `Property "${property}" can't be set in strict mode`,
        code: "strict"
      });
    }
    if (entry.required && settings.empty(value)) {
      errors.push({
        message: `Property "${property}" is "required"`,
        code: "required"
      });
      return errors;
    }
    if (entry.readonly && !first) {
      errors.push({
        message: `Property '${property}' is 'readonly'`,
        code: "readonly"
      });
      return errors;
    }
    if (typeof value === "undefined") {
      return errors;
    }
    if (entry.type && (entry.required || !settings.empty(value))) {
      if (!(isSmartModel(entry.type) && isPlainObject(value))) {
        if (!toArray(entry.type).some((type => checkType(value, type)))) {
          errors.push({
            message: `Property "${property}" has an invalid type "${typeof value}"`,
            code: "type"
          });
        }
      }
    }
    if (entry.rule) {
      keys(entry.rule, (key => {
        const rule = entry.rule[key];
        if (rule(value)) {
          errors.push({
            message: `Property "${property}" breaks the "${key}" rule`,
            code: "rule:" + key
          });
        }
      }));
    }
    return errors;
  }
  function createNested(entry = {}, property, settings) {
    if (!entry.type) {
      return false;
    }
    const Child = isSmartModel(entry.type) ? entry.type : false;
    const schema = isPlainObject(entry.type) ? entry.type : false;
    if (Child || schema) {
      const Model = Child ? Child : SmartModel.create(pascalCase(property), schema, settings);
      entry.type = Model;
      return Model;
    }
    return false;
  }
  class SmartModelProxy {
    constructor(schema, settings) {
      return new Proxy(this, {
        set(target, property, value) {
          const entry = schema[property] || {};
          const old = target[property];
          const first = isUndef(old);
          const updated = !first && !isEqual(value, old);
          const Nested = createNested(entry, property, settings);
          function trigger(method, args) {
            const returned = Reflect.apply(method, target, args ? args : [ property, value, old, schema ]);
            return !isUndef(returned) ? returned : value;
          }
          value = trigger(target.$onBeforeSet);
          if (updated) {
            value = trigger(target.$onBeforeUpdate);
          }
          if (isFn(entry.transform)) {
            value = trigger(entry.transform, [ value, schema ]);
          }
          const errors = checkErrors(entry, property, value, first, settings);
          if (errors.length) {
            if (settings.exceptions) {
              SmartModelError.throw(settings, errors[0].code, errors[0].message, property, target);
            } else {
              return true;
            }
          }
          if (settings.strict && !keys(entry).length) {
            return true;
          }
          if (Nested) {
            value = new Nested(value);
          }
          target[property] = value;
          trigger(target.$onSet);
          if (updated) {
            trigger(target.$onUpdate);
          }
          return true;
        },
        get(target, property) {
          const entry = schema[property];
          let value = target[property];
          if (property === "$eject") {
            return function() {
              return eject(target);
            };
          }
          if (!entry) {
            return target[property];
          }
          function trigger(method, args) {
            const returned = Reflect.apply(method, target, args ? args : [ property, value, schema ]);
            return !isUndef(returned) ? returned : value;
          }
          value = trigger(target.$onBeforeGet);
          if (isFn(entry)) {
            value = trigger(entry, [ target, schema ]);
          }
          if (isFn(entry.format)) {
            value = trigger(entry.format, [ value, schema ]);
          }
          value = trigger(target.$onGet);
          return value;
        },
        deleteProperty(target, property) {
          const value = target[property];
          const entry = schema[property] || {};
          function trigger(method, args) {
            return Reflect.apply(method, target, args ? args : [ property, value, schema ]);
          }
          if (entry.required) {
            SmartModelError.throw(settings, "required", `Property "${property}" is "required"`, property, target);
          }
          trigger(target.$onBeforeDelete);
          Reflect.deleteProperty(target, property);
          trigger(target.$onDelete);
          trigger(target.$onUpdate);
          return true;
        }
      });
    }
  }
  class SmartModel extends SmartModelProxy {
    constructor(schema = {}, data = {}, settings) {
      super(schema, settings);
      keys(schema, (key => {
        if (isUndef(data[key])) {
          if (!isUndef(schema[key].default)) {
            this[key] = schema[key].default;
          } else if (!isFn(schema[key])) {
            this[key] = data[key];
          }
        }
      }));
      this.$patch(data);
    }
    $patch(data) {
      keys(data, (key => {
        this[key] = data[key];
      }));
    }
    $put(data) {
      keys(this, (key => {
        if (data[key]) {
          if (isSmartModel(this[key])) {
            this[key].$put(data[key]);
          } else {
            this[key] = data[key];
          }
        } else {
          this.$delete(key);
        }
      }));
      keys(data, (key => {
        if (!this[key]) {
          this[key] = data[key];
        }
      }));
    }
    $delete(properties) {
      toArray(properties).forEach((key => {
        Reflect.deleteProperty(this, key);
      }));
    }
  }
  SmartModel.settings = {
    empty: value => value === "" || value === null || isUndef(value),
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
  };
  SmartModel.create = function(name, schema, settings) {
    settings = merge(SmartModel.settings, settings);
    const Model = {
      [name]: class extends SmartModel {
        constructor(data) {
          super(schema, data, settings);
        }
      }
    }[name];
    Model.checkErrors = function(payload, filters) {
      const invalidations = {};
      keys(schema, (property => {
        let subErrors;
        const value = payload[property];
        const entry = schema[property];
        const Nested = createNested(entry, property, settings);
        if (Nested) {
          subErrors = Nested.checkErrors(value, filters);
        }
        let errors = checkErrors(entry, property, value, false, settings);
        if (subErrors) {
          invalidations[property] = subErrors;
        } else if (errors.length) {
          if (filters) {
            errors = errors.filter((error => !toArray(filters).includes(error.code)));
          }
          if (errors.length) {
            invalidations[property] = errors;
          }
        }
      }));
      return keys(invalidations).length ? invalidations : false;
    };
    Model.hydrate = function(payload) {
      if (isArray(payload)) {
        return payload.map((item => new Model(item)));
      } else {
        return new Model(payload);
      }
    };
    Object.assign(Model.prototype, settings.methods);
    Model.schema = schema;
    return Model;
  };
  return SmartModel;
}();
