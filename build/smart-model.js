/**!
* SmartModel
* Javascript object model
* https://github.com/jaysalvat/smart-model
* @version 0.3.0 built 2021-02-22 09:17:46
* @license ISC
* @author Jay Salvat http://jaysalvat.com
*/
var SmartModel = function() {
  "use strict";
  class SmartModelError extends Error {
    constructor(data) {
      super(data.message);
      Object.assign(this, data);
    }
  }
  function isArray(value) {
    return Array.isArray(value);
  }
  function isUndef(value) {
    return typeof value === "undefined";
  }
  function isEmpty(value) {
    return value === "" || value === null || isUndef(value);
  }
  function isFn(value) {
    return typeof value === "function";
  }
  function isEqual(value1, value2) {
    return JSON.stringify(value1) === JSON.stringify(value2);
  }
  function isClass(value) {
    return value.toString().startsWith("class");
  }
  function isPlainObject(value) {
    return value.toString() === "[object Object]";
  }
  function isType(value, Type) {
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
  function toArray(value) {
    return [].concat([], value);
  }
  function pascalCase(string) {
    return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z]+/gi).map((word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())).join("");
  }
  function checkErrors(entry, property, value) {
    const errors = [];
    if (entry.required && isEmpty(value)) {
      errors.push({
        message: `Invalid value 'required' on property '${property}'`,
        code: "required"
      });
      return errors;
    }
    if (typeof value === "undefined") {
      return errors;
    }
    if (entry.type && (entry.required || !isEmpty(value))) {
      if (!toArray(entry.type).some((type => isType(value, type)))) {
        errors.push({
          message: `Invalid type '${typeof value}' on property '${property}'`,
          code: "type"
        });
      }
    }
    if (entry.rule) {
      Object.keys(entry.rule).forEach((key => {
        const rule = entry.rule[key];
        if (rule(value)) {
          errors.push({
            message: `Invalid value '${key}' on property '${property}'`,
            code: key
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
    const Child = entry.type.prototype instanceof SmartModel ? entry.type : false;
    const schema = isPlainObject(entry.type) ? entry.type : false;
    if (Child || schema) {
      return Child ? Child : SmartModel.create(pascalCase(property), schema, settings);
    }
    return false;
  }
  class SmartModelProxy {
    constructor(schema, settings) {
      return new Proxy(this, {
        set(target, property, value) {
          let entry = schema[property];
          const old = target[property];
          const updated = !isEqual(value, old);
          const Nested = createNested(entry, property, settings);
          function trigger(method, args) {
            return Reflect.apply(method, target, args ? args : [ property, value, old, schema ]);
          }
          if (!entry) {
            if (settings.strict) {
              return true;
            }
            entry = {};
          }
          trigger(target.onBeforeSet);
          if (updated) {
            trigger(target.onBeforeUpdate);
          }
          if (isFn(entry.transform)) {
            value = trigger(entry.transform, [ value, schema ]);
          }
          if (settings.exceptions) {
            const errors = checkErrors(entry, property, value);
            if (errors.length) {
              throw new SmartModelError({
                message: errors[0].message,
                property: property,
                code: errors[0].code,
                source: target.constructor.name
              });
            }
          }
          if (Nested) {
            value = new Nested(value instanceof Object ? value : {});
          }
          target[property] = value;
          trigger(target.onSet);
          if (updated) {
            trigger(target.onUpdate);
          }
          return true;
        },
        get(target, property) {
          const entry = schema[property];
          let value = target[property];
          if (!entry) {
            return target[property];
          }
          function trigger(method, args) {
            return Reflect.apply(method, target, args ? args : [ property, value, schema ]);
          }
          trigger(target.onBeforeGet);
          if (isFn(entry)) {
            value = trigger(entry, [ target, schema ]);
          }
          if (isFn(entry.format)) {
            value = trigger(entry.format, [ value, schema ]);
          }
          trigger(target.onGet);
          return value;
        },
        deleteProperty(target, property) {
          const value = target[property];
          const entry = schema[property];
          function trigger(method, args) {
            return Reflect.apply(method, target, args ? args : [ property, value, schema ]);
          }
          if (entry.required) {
            throw new SmartModelError({
              message: `Invalid delete on required propery ${property}`,
              property: property,
              code: "required"
            });
          }
          trigger(target.onBeforeDelete);
          Reflect.deleteProperty(target, property);
          trigger(target.onDelete);
          trigger(target.onUpdate);
          return true;
        }
      });
    }
  }
  class SmartModel extends SmartModelProxy {
    constructor(schema = {}, data = {}, settings) {
      super(schema, settings);
      Object.keys(schema).forEach((key => {
        if (isUndef(data[key])) {
          if (!isUndef(schema[key].default)) {
            this[key] = schema[key].default;
          } else {
            this[key] = data[key];
          }
        }
      }));
      this.feed(data);
    }
    feed(data) {
      Object.keys(data).forEach((key => {
        this[key] = data[key];
      }));
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
  SmartModel.create = function(name, schema, settings, prototype) {
    settings = Object.assign({}, SmartModel.settings, settings);
    const Model = {
      [name]: class extends SmartModel {
        constructor(data) {
          super(schema, data, settings);
        }
      }
    }[name];
    Model.checkErrors = function(payload, filters) {
      const invalidations = {};
      Object.keys(schema).forEach((property => {
        let subErrors;
        const value = payload[property];
        const entry = schema[property];
        const Nested = createNested(entry, property, settings);
        if (Nested) {
          subErrors = Nested.checkErrors(value, filters);
        }
        let errors = checkErrors(entry, property, value);
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
      return Object.keys(invalidations).length ? invalidations : false;
    };
    Model.hydrate = function(payload) {
      if (isArray(payload)) {
        return payload.map((item => new Model(item)));
      } else {
        return new Model(payload);
      }
    };
    Object.assign(Model.prototype, prototype);
    Model.schema = schema;
    return Model;
  };
  return SmartModel;
}();
