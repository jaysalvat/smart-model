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
    let entry = schema[property];

    function trigger(method) {
      return Reflect.apply(method, target, [ property, value, oldValue, schema ])
    }

    if (this.settings.strict && !entry) {
      return true
    } else {
      entry = {};
    }

    if (entry.transform) {
      value = entry.transform(value);
    }

    trigger(target.onBeforeSet);

    if (updated) {
      trigger(target.onBeforeUpdate);
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

  deleteProperty(target, property) {
    const value = clone(target[property]);
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

    trigger(target.onDelete, [ property, value, schema ]);
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

  const ModelClass = { [name]: class extends Model {
    constructor(data) {
      super(schema, data);

      return new Proxy(this, new ModelHandler(schema, settings))
    }
  } }[name];

  ModelClass.checkErrors = function (payload, required) {
    return Model.checkErrors(schema, payload, required)
  };

  Object.assign(ModelClass.prototype, prototype);

  return ModelClass
};

Model.checkErrors = function (schema, payload, filters) {
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

    return
  });

  return Object.keys(invalidations).length ? invalidations : false
};

Model.hydrate = function (ModelToHydrate, payload) {
  if (isArray(payload)) {
    return payload.map((item) => new ModelToHydrate(item))
  }

  return new ModelToHydrate(payload)
};

export default Model;
