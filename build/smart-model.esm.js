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

function checkErrors(entry, property, value) {
  const errors = [];

  if (entry.required) {
    if (isEmpty(value)) {
      errors.push({
        message: `Invalid value 'required' on property '${property}'`,
        code: 'required',
        value: value
      });
    }
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
        code: 'type',
        value: value,
        expected: types
      });
    }
  }

  if (entry.rule) {
    Object.keys(entry.rule).forEach((key) => {
      const rule = entry.rule[key];

      if (rule(value)) {
        errors.push({
          message: `Invalid value '${key}' on property '${property}'`,
          code: key,
          value: value,
          expected: rule
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

  constructor(schema = {}) {
    this.schema = schema;
  }

  // Setter

  set(target, property, value) {
    const schema = this.schema;
    const entry = schema[property];
    const oldValue = target[property];
    const updated = !isEqual(value, oldValue);

    function trigger(method) {
      return Reflect.apply(method, target, [ property, value, oldValue, schema ])
    }

    if (isFn(entry)) {
      return false
    }

    if (entry.transform) {
      value = entry.transform(value);
    }

    trigger(target.onBeforeSet);

    if (updated) {
      trigger(target.onBeforeUpdate);
    }

    if (Model.settings.exceptions) {
      const errors = checkErrors(entry, property, value);

      if (errors.length) {
        errors.forEach((error) => {
          throw new ModelError({
            message: error.message,
            property: property,
            code: error.code,
            value: error.value,
            expected: error.expected
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

  // Getter

  get(target, property) {
    let value = target[property];
    const schema = this.schema;
    const entry = schema[property];
    
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
    Object.keys(data).forEach((key) => {
      this[key] = data[key];
    });
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
};

Model.create = function (type, schema = {}, prototype = {}) {
  const ModelClass = {
    [type]: class extends Model {
      constructor(data) {
        super(schema, data);

        return new Proxy(this, new ModelHandler(schema))
      }
    }
  };

  Object.assign(ModelClass[type].prototype, prototype);

  return ModelClass[type]
};

Model.throwExeptions = function (bool) {
  Model.settings.exeptions = bool;
};

Model.checkErrors = function (schema, payload) {
  const invalidations = {};

  Object.keys(schema).forEach((property) => {
    const value = payload[property];
    const entry = schema[property];
    const errors = checkErrors(entry, property, value);

    if (typeof entry === 'function') {
      return
    }

    if (errors.length) {
      invalidations[property] = errors;
    }

    return
  });

  return Object.keys(invalidations).length ? invalidations : false
};

Model.hydrate = function (ModelToHydrate, payload) {
  if (isArray(payload)) {
    return payload.map((item) => new ModelToHydrate(item))
  } else {
    return new ModelToHydrate(payload)
  }
};

export default Model;
