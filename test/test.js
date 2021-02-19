/* eslint-disable prefer-reflect */
/* eslint-disable no-new */
/* eslint-env mocha */

import chai from 'chai'
import SmartModel from '../src/SmartModel.js'

const { expect } = chai
let undef

describe('SmartModel', function () {

  // Init

  describe('Init', function () {
    it('should create a Model', function () {
      const Model = SmartModel.create('Model', {})
      const model = new Model()

      expect(Model).to. be.an.instanceOf(Function)
      expect(model).to. be.an.instanceOf(SmartModel)
      expect(model).to. be.an.instanceOf(Model)
    })

    it('should populate with a schema', function () {
      const Model = SmartModel.create('Model', {
        prop1: {}, prop2: {}, prop3: {}
      })
      const model = new Model()

      expect(Object.keys(model).length).to.be.equal(3)
    })

    it('should add default values', function () {
      const Model = SmartModel.create('Model', {
        prop1: { default: 'Default prop1' },
        prop2: { }
      })
      const model = new Model()

      expect(model.prop1).to.be.equal('Default prop1')
      expect(model.prop2).to.be.equal(undef)
    })
  })

  // Required

  describe('Required', function () {
    it('should throw an exception if a required prop is not set on init', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true }
      })

      try {
        new Model()
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal('prop')
      expect(code).to.be.equal('required')
    })

    it('should not throw an exception if a required prop is set on init', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true }
      })

      try {
        new Model({ prop: 'ok' })
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal(undef)
      expect(code).to.be.equal(undef)
    })

    it('should not throw an exception if a required prop is not set but have default value on init', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, default: 'ok' }
      })

      try {
        new Model()
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal(undef)
      expect(code).to.be.equal(undef)
    })

    it('should throw an exception if a required prop is set to empty', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, default: 'ok' }
      })

      try {
        const model = new Model()

        model.prop = null
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal('prop')
      expect(code).to.be.equal('required')
    })

    it('should throw an exception if a required prop is deleted', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, default: 'ok' }
      })

      try {
        const model = new Model()

        delete model.prop
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal('prop')
      expect(code).to.be.equal('required')
    })
  })

  // Type

  describe('Type', function () {
    it('should throw an exception if a typed prop is not set properly', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, type: String }
      })

      try {
        new Model({
          prop: 0
        })
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal('prop')
      expect(code).to.be.equal('type')
    })

    it('should not throw an exception if a typed prop is set properly', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, type: String }
      })

      try {
        new Model({
          prop: 'ok'
        })
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal(undef)
      expect(code).to.be.equal(undef)
    })

    it('should not throw an exception if multiple typed props is set properly', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, type: [ String, Array ] }
      })

      try {
        const model = new Model({ prop: 'ok' })

        model.prop = [ 'ok' ]
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal(undef)
      expect(code).to.be.equal(undef)
    })

    it('should not throw an exception if a typed prop is set on a not required property', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { type: String }
      })

      try {
        new Model()
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal(undef)
      expect(code).to.be.equal(undef)
    })
  })

  // Rule

  describe('Rule', function () {
    it('should throw an exception if a ruled prop is not set properly', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, rule: {
          min: (value) => value < 5
        } }
      })

      try {
        new Model({
          prop: 0
        })
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal('prop')
      expect(code).to.be.equal('min')
    })

    it('should not throw an exception if a ruled prop is set properly', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { required: true, rule: {
          min: (value) => value < 5
        } }
      })

      try {
        new Model({ prop: 10 })
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal(undef)
      expect(code).to.be.equal(undef)
    })

    it('should not throw an exception if a ruled prop is set on an empty not required property', function () {
      let code, property
      const Model = SmartModel.create('Model', {
        prop: { rule: {
          min: (value) => value < 5
        } }
      })

      try {
        new Model()
      } catch (e) {
        property = e.property
        code = e.code
      }

      expect(property).to.be.equal(undef)
      expect(code).to.be.equal(undef)
    })
  })

  // Format / Transfor

  describe('Format / Transform', function () {
    it('should transform a value', function () {
      const Model = SmartModel.create('Model', {
        prop: { transform: (value) => 'transform: ' + value }
      })

      const model = new Model({ prop: 'ok' })

      expect(model.prop).to.be.equal('transform: ok')
    })

    it('should format a value', function () {
      const Model = SmartModel.create('Model', {
        prop: { format: (value) => 'format: ' + value }
      })

      const model = new Model({ prop: 'ok' })

      expect(model.prop).to.be.equal('format: ok')
    })

    it('should transform and format a value', function () {
      const Model = SmartModel.create('Model', {
        prop: {
          transform: (value) => 'transform: ' + value,
          format: (value) => 'format: ' + value
        }
      })

      const model = new Model({ prop: 'ok' })

      expect(model.prop).to.be.equal('format: transform: ok')
    })
  })

  describe('Virtual', function () {
    it('should get a virtual property', function () {
      const Model = SmartModel.create('Model', {
        today: () => new Date()
      })

      const model = new Model()

      expect(model.today.toString()).to.be.equal(new Date().toString())
    })

    it('should get a virtual property with context', function () {
      const Model = SmartModel.create('Model', {
        prop1: { default: 'ok' },
        prop2: (model) => 'virtual: ' + model.prop1
      })

      const model = new Model()

      expect(model.prop1).to.be.equal('ok')
      expect(model.prop2).to.be.equal('virtual: ok')
    })
  })

  describe('Events', function () {
    it('should trigger onBeforeDelete', testTrigger('onBeforeDelete'))
    it('should trigger onBeforeGet', testTrigger('onBeforeGet'))
    it('should trigger onBeforeSet', testTrigger('onBeforeSet'))
    it('should trigger onBeforeUpdate', testTrigger('onBeforeUpdate'))
    it('should trigger onDelete', testTrigger('onDelete'))
    it('should trigger onGet', testTrigger('onGet'))
    it('should trigger onSet', testTrigger('onSet'))
    it('should trigger onUpdate', testTrigger('onUpdate'))
  })

  describe('Statics methods', function () {
    describe('checkErrors', function () {
      it('should return an array of model errors', function () {
        const Model = SmartModel.create('Model', {
          prop1: { required: true },
          prop2: { type: String },
          prop3: { type: String },
          prop4: {
            rule: {
              min: (value) => value < 5,
              pos: (value) => value < 0
            }
          }
        })

        const errrors = Model.checkErrors({
          prop2: 0,
          prop3: 'ok',
          prop4: -1
        })

        const errorProperties = Object.keys(errrors)

        expect(errorProperties.length).to.be.equal(3)
        expect(errrors.prop1[0].code).to.be.equal('required')
        expect(errrors.prop2[0].code).to.be.equal('type')
        expect(errrors.prop4[0].code).to.be.equal('min')
        expect(errrors.prop4[1].code).to.be.equal('pos')
      })

      it('should return an array of model errors without type', function () {
        const Model = SmartModel.create('Model', {
          prop1: { type: String, required: true },
          prop2: { type: String },
          prop3: { type: String, required: true },
          prop4: { type: String }
        })

        const errrors = Model.checkErrors({
          prop2: 0,
          prop4: 0
        }, [ 'type' ])

        const errorProperties = Object.keys(errrors)

        expect(errorProperties.length).to.be.equal(2)
        expect(errrors.prop1[0].code).to.be.equal('required')
        expect(errrors.prop3[0].code).to.be.equal('required')
      })

      it('should not return an array of model errors', function () {
        const Model = SmartModel.create('Model', {
          prop1: { type: String, required: true },
          prop2: { type: String },
          prop3: { type: String, required: true },
          prop4: { type: String }
        })

        const errrors = Model.checkErrors({
          prop1: 'ok',
          prop3: 'ok'
        })

        expect(errrors).to.be.equal(false)
      })
    })

    describe('hydrate', function () {
      it('should hydrate a object', function () {
        const obj = {
          prop1: 'ok'
        }

        const Model = SmartModel.create('Model', {
          prop1: { format: (value) => 'format: ' + value },
          prop2: { default: 'default' }
        })

        const model = Model.hydrate(obj)

        expect(model.prop1).to.be.equal('format: ok')
        expect(model.prop2).to.be.equal('default')
      })

      it('should hydrate an array of objects', function () {
        const objs = [
          { prop1: 'ok 1' },
          { prop1: 'ok 2' },
          { prop1: 'ok 3' }
        ]

        const Model = SmartModel.create('Model', {
          prop1: { format: (value) => 'format: ' + value },
          prop2: { default: 'default' }
        })

        const models = Model.hydrate(objs)

        models.forEach((model, i) => {
          expect(model.prop1).to.be.equal('format: ok ' + (i + 1))
          expect(model.prop2).to.be.equal('default')
        })
      })
    })

    describe('Settings', function () {

      it('should set settings for all instances', function () {
        SmartModel.settings.strict = true

        const Model1 = SmartModel.create('Model1', {
          prop1: { type: String }
        })

        const Model2 = SmartModel.create('Model2', {
          prop1: { type: String }
        }, {}, { strict: false })

        const Model3 = SmartModel.create('Model3', {
          prop1: { type: String }
        })

        const model1 = new Model1({
          prop1: 'ok',
          prop2: 'ok'
        })

        const model2 = new Model2({
          prop1: 'ok',
          prop2: 'ok'
        })

        const model3 = new Model3({
          prop1: 'ok',
          prop2: 'ok'
        })

        expect(model1.prop1).to.be.equal('ok')
        expect(model1.prop2).to.be.equal(undef)

        expect(model2.prop1).to.be.equal('ok')
        expect(model2.prop2).to.be.equal('ok')

        expect(model3.prop1).to.be.equal('ok')
        expect(model3.prop2).to.be.equal(undef)
      })

      describe('strict', function () {
        it('should not set undefined properties if strict:true', function () {
          const Model = SmartModel.create('Model', {
            prop1: { type: String }
          }, {}, {
            strict: true
          })

          const model = new Model({
            prop1: 'ok',
            prop2: 'ok'
          })

          expect(model.prop1).to.be.equal('ok')
          expect(model.prop2).to.be.equal(undef)
        })

        it('should set undefined properties if strict:false', function () {
          const Model = SmartModel.create('Model', {
            prop1: { type: String }
          }, {}, {
            strict: false
          })

          const model = new Model({
            prop1: 'ok',
            prop2: 'ok'
          })

          expect(model.prop1).to.be.equal('ok')
          expect(model.prop2).to.be.equal('ok')
        })
      })

      describe('exceptions', function () {
        it('should not throw exceptions if exceptions:false', function () {
          const Model = SmartModel.create('Model', {
            prop1: { required: true }
          }, {}, {
            exceptions: false
          })

          expect(() => {
            new Model()
          }).to.not.throw(Error)
        })

        it('should throw exceptions if exceptions:true', function () {
          const Model = SmartModel.create('Model', {
            prop1: { required: true }
          }, {}, {
            exceptions: true
          })

          expect(() => {
            new Model()
          }).to.throw(Error)
        })
      })
    })
  })

  function testTrigger(name) {
    return function () {
      let property, value, oldValue
      const Model = SmartModel.create('Model', {
        prop: { default: 'old value' }
      }, {
        [name](prop, val, oldVal) {
          property = prop
          value = val
          oldValue = oldVal
        }
      })

      const model = new Model()

      model.prop = 'new value'

      if ([ 'onBeforeDelete', 'onDelete' ].includes(name)) {
        delete model.prop

        expect(property).to.be.equal('prop')

      } else if ([ 'onBeforeGet', 'onGet' ].includes(name)) {
        model.prop = model.prop

        expect(property).to.be.equal('prop')
        expect(value).to.be.equal('new value')
      } else {

        expect(property).to.be.equal('prop')
        expect(value).to.be.equal('new value')
        expect(oldValue).to.be.equal('old value')
      }
    }
  }
})
