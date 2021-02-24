/*! SmartModel v0.3.4 */

'use strict'; function isArray(e) {
  return Array.isArray(e)
} function isUndef(e) {
  return void 0 === e
} function isFn(e) {
  return typeof e === 'function'
} function isEqual(e, t) {
  return JSON.stringify(e) === JSON.stringify(t)
} function isClass(e) {
  return e && e.toString().startsWith('class')
} function isSmartModel(e) {
  return e.prototype instanceof SmartModel || e instanceof SmartModel
} function isPlainObject(e) {
  return e && e.toString() === '[object Object]'
} function keys(e, t = function () {}) {
  return Object.keys(e).map(t)
} function toArray(e) {
  return [].concat([], e)
} function merge(e, t) {
  return t = Object.assign({}, e, t), keys(e, (r) => {
    isPlainObject(e[r]) && isPlainObject(t[r]) && (t[r] = Object.assign({}, e[r], merge(e[r], t[r])))
  }), t
} function eject(e) {
  return keys(e = Object.assign({}, e), (t) => {
    isSmartModel(e[t]) && (e[t] = e[t].$get())
  }), e
} function pascalCase(e) {
  return e.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z1-9]+/gi).map((e) => e.charAt(0).toUpperCase() + e.substr(1).toLowerCase()).join('')
} function checkType(e, t) {
  const r = t && t.toString().match(/^\s*function (\w+)/), n = (r ? r[1] : 'object').toLowerCase()

  if (n === 'date' && e instanceof t) {
    return !0
  } if (n === 'array' && isArray(e)) {
    return !0
  } if (n === 'object') {
    if (isClass(t) && e instanceof t) {
      return !0
    } if (!isClass(t) && typeof e === n) {
      return !0
    }
  } else if (typeof e === n) {
    return !0
  }

  return !1
} class SmartModelError extends Error {
  constructor(e) {
    super(e.message), Object.assign(this, e)
  }
} function checkErrors(e, t, r, n, s) {
  const o = []

  return !s.strict || e && keys(e).length || o.push({ message: `Property "${t}" can't be set in strict mode`, code: 'strict' }), e.required && s.empty(r) ? (o.push({ message: `Property "${t}" is "required"`, code: 'required' }), o) : e.readonly && !n ? (o.push({ message: `Property '${t}' is 'readonly'`, code: 'readonly' }), o) : (void 0 === r || (!e.type || !e.required && s.empty(r) || isSmartModel(e.type) && isPlainObject(r) || toArray(e.type).some((e) => checkType(r, e)) || o.push({ message: `Property "${t}" has an invalid type "${typeof r}"`, code: 'type' }), e.rule && keys(e.rule, (n) => {
    (0, e.rule[n])(r) && o.push({ message: `Property "${t}" breaks the "${n}" rule`, code: 'rule:' + n })
  })), o)
} function createNested(e = {}, t, r) {
  if (!e.type) {
    return !1
  } const n = !!isSmartModel(e.type) && e.type, s = !!isPlainObject(e.type) && e.type

  if (n || s) {
    const o = n || SmartModel.create(pascalCase(t), s, r)

    return e.type = o, o
  }

  return !1
}SmartModelError.throw = function (e, t, r, n, s) {
  const o = t.split(':')[0]

  if (!0 === e.exceptions || isPlainObject(e.exceptions) && e.exceptions[o]) {
    throw new SmartModelError({ message: r, property: n, code: t, source: s && s.constructor.name })
  }
}; class SmartModelProxy {
  constructor(e, t) {
    return new Proxy(this, { set(r, n, s) {
      const o = e[n] || {}, i = r[n], c = isUndef(i), a = !c && !isEqual(s, i), u = createNested(o, n, t)

      function l(t, o) {
        const c = Reflect.apply(t, r, o || [ n, s, i, e ])

        return isUndef(c) ? s : c
      }s = l(r.$onBeforeSet), a && (s = l(r.$onBeforeUpdate)), isFn(o.transform) && (s = l(o.transform, [ s, e ])); const f = checkErrors(o, n, s, c, t)

      if (f.length) {
        if (!t.exceptions) {
          return !0
        } SmartModelError.throw(t, f[0].code, f[0].message, n, r)
      }

      return t.strict && !keys(o).length || (u && (s = new u(s)), r[n] = s, l(r.$onSet), a && l(r.$onUpdate)), !0
    }, get(t, r) {
      const n = e[r]; let s = t[r]

      if (r === '$get') {
        return function () {
          return eject(t)
        }
      } if (!n) {
        return t[r]
      } function o(n, o) {
        const i = Reflect.apply(n, t, o || [ r, s, e ])

        return isUndef(i) ? s : i
      }

      return s = o(t.$onBeforeGet), isFn(n) && (s = o(n, [ t, e ])), isFn(n.format) && (s = o(n.format, [ s, e ])), s = o(t.$onGet), s
    }, deleteProperty(r, n) {
      const s = r[n]

      function o(t, o) {
        return Reflect.apply(t, r, o || [ n, s, e ])
      }

      return (e[n] || {}).required && SmartModelError.throw(t, 'required', `Property "${n}" is "required"`, n, r), o(r.$onBeforeDelete), Reflect.deleteProperty(r, n), o(r.$onDelete), o(r.$onUpdate), !0
    } })
  }
} class SmartModel extends SmartModelProxy {
  constructor(e = {}, t = {}, r) {
    super(e, r), keys(e, (r) => {
      isUndef(t[r]) && (isUndef(e[r].default) ? isFn(e[r]) || (this[r] = t[r]) : this[r] = e[r].default)
    }), this.$patch(t)
  }$patch(e) {
    keys(e, (t) => {
      this[t] = e[t]
    })
  }$put(e) {
    keys(this, (t) => {
      e[t] ? isSmartModel(this[t]) ? this[t].$put(e[t]) : this[t] = e[t] : this.$delete(t)
    }), keys(e, (t) => {
      this[t] || (this[t] = e[t])
    })
  }$delete(e) {
    toArray(e).forEach((e) => {
      Reflect.deleteProperty(this, e)
    })
  }
}SmartModel.settings = { empty: (e) => e === '' || e === null || isUndef(e), strict: !1, exceptions: { readonly: !1, required: !0, rule: !0, strict: !1, type: !0 }, methods: { $onBeforeGet: () => {}, $onBeforeSet: () => {}, $onBeforeUpdate: () => {}, $onDelete: () => {}, $onGet: () => {}, $onBeforeDelete: () => {}, $onSet: () => {}, $onUpdate: () => {} } }, SmartModel.create = function (e, t, r) {
  r = merge(SmartModel.settings, r); const n = { [e]: class extends SmartModel {
    constructor(e) {
      super(t, e, r)
    }
  } }[e]

  return n.$check = function (e, n) {
    const s = {}

    return keys(t, (o) => {
      let i; const c = e[o], a = t[o], u = createNested(a, o, r)

      u && (i = u.$check(c, n)); let l = checkErrors(a, o, c, !1, r)

      i ? s[o] = i : l.length && (n && (l = l.filter((e) => !toArray(n).includes(e.code))), l.length && (s[o] = l))
    }), !!keys(s).length && s
  }, n.hydrate = function (e) {
    return isArray(e) ? e.map((e) => new n(e)) : new n(e)
  }, Object.assign(n.prototype, r.methods), n.schema = t, n
}, module.exports = SmartModel
