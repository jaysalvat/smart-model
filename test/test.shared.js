/* eslint-disable prefer-reflect */
/* eslint-disable no-new */
/* eslint-env mocha */

export default function test(expect, SmartModel) {

  let undef

  describe('SmartModel tests', function () {

    // Init

    describe('Init', function () {
      it('should create a Model', function () {
        const Model = SmartModel.create('Model', {})
        const model = new Model()

        expect(Model).to.be.an.instanceOf(Function)
        expect(model).to.be.an.instanceOf(SmartModel)
        expect(model).to.be.an.instanceOf(Model)
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
      it('should throw an error if a required prop is not set on init', function () {
        const Model = SmartModel.create('Model', {
          prop: { required: true }
        })

        const err = checkExceptions(() => {
          new Model()
        })

        expect(err.source).to.be.equal('Model')
        expect(err.property).to.be.equal('prop')
        expect(err.code).to.be.equal('required')
      })

      it('should not throw an error  if a required prop is set on init', function () {
        const Model = SmartModel.create('Model', {
          prop: { required: true }
        })

        const err = checkExceptions(() => {
          new Model({ prop: 'string' })
        })

        expect(err.property).to.be.equal(undef)
        expect(err.code).to.be.equal(undef)
      })

      it('should not throw an error  if a required prop is not set but have default value on init', function () {
        const Model = SmartModel.create('Model', {
          prop: { required: true, default: 'string' }
        })

        const err = checkExceptions(() => {
          new Model()
        })

        expect(err.property).to.be.equal(undef)
        expect(err.code).to.be.equal(undef)
      })

      it('should throw an error  if a required prop is set to empty', function () {

        const Model = SmartModel.create('Model', {
          prop: { required: true, default: 'string' }
        })
        const model = new Model()

        const err = checkExceptions(() => {
          model.prop = null
        })

        expect(err.property).to.be.equal('prop')
        expect(err.code).to.be.equal('required')
      })

      it('should throw an error  if a required prop is deleted', function () {

        const Model = SmartModel.create('Model', {
          prop: { required: true, default: 'string' }
        })
        const model = new Model()

        const err = checkExceptions(() => {
          delete model.prop
        })

        expect(err.property).to.be.equal('prop')
        expect(err.code).to.be.equal('required')
      })
    })

    // Type

    describe('Type', function () {
      it('should throw an error  if a typed prop is not set properly', function () {
        const Model = SmartModel.create('Model', {
          prop: { required: true, type: String }
        })

        const err = checkExceptions(() => {
          new Model({ prop: 0 })
        })

        expect(err.property).to.be.equal('prop')
        expect(err.code).to.be.equal('type')
      })

      it('should not throw an error  if a typed prop is set properly', function () {
        const Model = SmartModel.create('Model', {
          prop: { required: true, type: String }
        })

        const err = checkExceptions(() => {
          new Model({ prop: 'string' })
        })

        expect(err.property).to.be.equal(undef)
        expect(err.code).to.be.equal(undef)
      })

      it('should not throw an error  if multiple typed props is set properly', function () {
        const Model = SmartModel.create('Model', {
          prop: { type: [ String, Array ] }
        })
        const model = new Model()

        const err = checkExceptions(() => {
          model.prop = 'string'
          model.prop = [ 'string' ]
        })

        expect(err.property).to.be.equal(undef)
        expect(err.code).to.be.equal(undef)
      })

      it('should not throw an error  if a typed prop is set on a not required property', function () {
        const Model = SmartModel.create('Model', {
          prop: { type: String }
        })

        const err = checkExceptions(() => {
          new Model()
        })

        expect(err.property).to.be.equal(undef)
        expect(err.code).to.be.equal(undef)
      })
    })

    // Rule

    describe('Rule', function () {
      it('should throw an error  if a ruled prop is not set properly', function () {
        const Model = SmartModel.create('Model', {
          prop: { required: true, rule: {
            min: (value) => value < 5
          } }
        })

        const err = checkExceptions(() => {
          new Model({ prop: 0 })
        })

        expect(err.property).to.be.equal('prop')
        expect(err.code).to.be.equal('min')
      })

      it('should not throw an error  if a ruled prop is set properly', function () {
        const Model = SmartModel.create('Model', {
          prop: { required: true, rule: {
            min: (value) => value < 5
          } }
        })

        const err = checkExceptions(() => {
          new Model({ prop: 10 })
        })

        expect(err.property).to.be.equal(undef)
        expect(err.code).to.be.equal(undef)
      })

      it('should not throw an error  if a ruled prop is set on an empty not required property', function () {
        let err = {}
        const Model = SmartModel.create('Model', {
          prop: { rule: {
            min: (value) => value < 5
          } }
        })

        try {
          new Model()
        } catch (e) {
          err = e
        }

        expect(err.property).to.be.equal(undef)
        expect(err.code).to.be.equal(undef)
      })
    })

    // Format / Transfor

    describe('Format / Transform', function () {
      it('should transform a value', function () {
        const Model = SmartModel.create('Model', {
          prop: { transform: (value) => 'transform: ' + value }
        })

        const model = new Model({ prop: 'string' })

        expect(model.prop).to.be.equal('transform: string')
      })

      it('should format a value', function () {
        const Model = SmartModel.create('Model', {
          prop: { format: (value) => 'format: ' + value }
        })

        const model = new Model({ prop: 'string' })

        expect(model.prop).to.be.equal('format: string')
      })

      it('should transform and format a value', function () {
        const Model = SmartModel.create('Model', {
          prop: {
            transform: (value) => 'transform: ' + value,
            format: (value) => 'format: ' + value
          }
        })

        const model = new Model({ prop: 'string' })

        expect(model.prop).to.be.equal('format: transform: string')
      })
    })

    // Virtual property

    describe('Virtual property', function () {
      it('should get a virtual property', function () {
        const Model = SmartModel.create('Model', {
          today: () => new Date()
        })

        const model = new Model()

        expect(model.today.toString()).to.be.equal(new Date().toString())
      })

      it('should get a virtual property with context', function () {
        const Model = SmartModel.create('Model', {
          prop1: { default: 'string' },
          prop2: (model) => 'virtual: ' + model.prop1
        })

        const model = new Model()

        expect(model.prop1).to.be.equal('string')
        expect(model.prop2).to.be.equal('virtual: string')
      })
    })

    // Events

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

    // Methods

    describe('Statics methods', function () {
      describe('CheckErrors', function () {
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
            prop3: 'string',
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
            prop1: 'string',
            prop3: 'string'
          })

          expect(errrors).to.be.equal(false)
        })
      })

      describe('Hydrate', function () {
        it('should hydrate a object', function () {
          const obj = {
            prop1: 'string'
          }

          const Model = SmartModel.create('Model', {
            prop1: { format: (value) => 'format: ' + value },
            prop2: { default: 'default' }
          })

          const model = Model.hydrate(obj)

          expect(model.prop1).to.be.equal('format: string')
          expect(model.prop2).to.be.equal('default')
        })

        it('should hydrate an array of objects', function () {
          const objs = [
            { prop1: 'string 1' },
            { prop1: 'string 2' },
            { prop1: 'string 3' }
          ]

          const Model = SmartModel.create('Model', {
            prop1: { format: (value) => 'format: ' + value },
            prop2: { default: 'default' }
          })

          const models = Model.hydrate(objs)

          models.forEach((model, i) => {
            expect(model.prop1).to.be.equal('format: string ' + (i + 1))
            expect(model.prop2).to.be.equal('default')
          })
        })
      })

      // Settings

      describe('Settings', function () {
        it('should set settings for all instances', function () {
          SmartModel.settings.strict = true

          const Model1 = SmartModel.create('Model1', {
            prop1: { type: String }
          })

          const Model2 = SmartModel.create('Model2', {
            prop1: { type: String }
          }, { strict: false })

          const Model3 = SmartModel.create('Model3', {
            prop1: { type: String }
          })

          const model1 = new Model1({
            prop1: 'string',
            prop2: 'string'
          })

          const model2 = new Model2({
            prop1: 'string',
            prop2: 'string'
          })

          const model3 = new Model3({
            prop1: 'string',
            prop2: 'string'
          })

          expect(model1.prop1).to.be.equal('string')
          expect(model1.prop2).to.be.equal(undef)

          expect(model2.prop1).to.be.equal('string')
          expect(model2.prop2).to.be.equal('string')

          expect(model3.prop1).to.be.equal('string')
          expect(model3.prop2).to.be.equal(undef)
        })

        describe('strict', function () {
          it('should not set undefined properties if strict:true', function () {
            const Model = SmartModel.create('Model', {
              prop1: { type: String }
            }, {
              strict: true
            })

            const model = new Model({
              prop1: 'string',
              prop2: 'string'
            })

            expect(model.prop1).to.be.equal('string')
            expect(model.prop2).to.be.equal(undef)
          })

          it('should set undefined properties if strict:false', function () {
            const Model = SmartModel.create('Model', {
              prop1: { type: String }
            }, {
              strict: false
            })

            const model = new Model({
              prop1: 'string',
              prop2: 'string'
            })

            expect(model.prop1).to.be.equal('string')
            expect(model.prop2).to.be.equal('string')
          })
        })

        describe('exceptions', function () {
          it('should not throw errors if exceptions:false', function () {
            const Model = SmartModel.create('Model', {
              prop1: { required: true }
            }, {
              exceptions: false
            })

            expect(() => {
              new Model()
            }).to.not.throw(Error)
          })

          it('should throw errors if exceptions:true', function () {
            const Model = SmartModel.create('Model', {
              prop1: { required: true }
            }, {
              exceptions: true
            })

            expect(() => {
              new Model()
            }).to.throw(Error)
          })
        })
      })
    })

    // Nested models

    describe('Nested model', function () {
      it('should nest a child model with another model', function () {
        const SubModel = SmartModel.create('SubModel', {
          nestedProp: {
            default: 'string2'
          }
        })

        const Model = SmartModel.create('Model', {
          prop1: { default: 'string1' },
          prop2: { type: SubModel }
        })

        const model = new Model()

        expect(model).to.be.an.instanceOf(SmartModel)
        expect(model.prop1).to.be.equal('string1')
        expect(model.prop2).to. be.an.instanceOf(SmartModel)
        expect(model.prop2.nestedProp).to.be.equal('string2')
      })

      it('should nest a child model with schema', function () {
        const Model = SmartModel.create('Model', {
          prop1: {
            default: 'string1'
          },
          prop2: {
            type: {
              nestedProp: {
                default: 'string2'
              }
            }
          }
        })

        const model = new Model()

        expect(model.prop1).to.be.equal('string1')
        expect(model.prop2).to.be.an.instanceOf(SmartModel)
        expect(model.prop2.nestedProp).to.be.equal('string2')
      })

      it('should nest a child model in a child model with schema', function () {
        const Model = SmartModel.create('Model', {
          prop: {
            type: {
              nestedProp: {
                type: {
                  nestedNestedProp: {
                    default: 'string'
                  }
                }
              }
            }
          }
        })

        const model = new Model()

        expect(model).to.be.an.instanceOf(SmartModel)
        expect(model.prop).to.be.an.instanceOf(SmartModel)
        expect(model.prop.nestedProp).to.be.an.instanceOf(SmartModel)
      })

      it('should throw an error if a required parent prop is not set on init', function () {
        const Model = SmartModel.create('Model', {
          prop: {
            required: true,
            type: {
              nestedProp: {
                default: 'string'
              }
            }
          }
        })

        const err = checkExceptions(() => {
          new Model()
        })

        expect(err.property).to.be.equal('prop')
        expect(err.source).to.be.equal('Model')
        expect(err.code).to.be.equal('required')
      })

      it('should throw an error if a typed parent prop is not set properly', function () {
        const Model = SmartModel.create('Model', {
          prop: {
            type: {
              nestedProp: {}
            }
          }
        })

        const err = checkExceptions(() => {
          new Model({ prop: 'string' })
        })

        expect(err.property).to.be.equal('prop')
        expect(err.source).to.be.equal('Model')
        expect(err.code).to.be.equal('type')
      })

      it('should throw an error if a required nested prop is not set on init', function () {
        const Model = SmartModel.create('Model', {
          prop: {
            type: {
              nestedProp: {
                required: true
              }
            }
          }
        })

        const err = checkExceptions(() => {
          new Model({
            prop: { nestedProp: null }
          })
        })

        expect(err.property).to.be.equal('nestedProp')
        expect(err.source).to.be.equal('Prop')
        expect(err.code).to.be.equal('required')
      })

      it('should throw an error if a typed nested prop is not set properly', function () {
        const Model = SmartModel.create('Model', {
          prop: {
            type: {
              nestedProp: {
                type: String
              }
            }
          }
        })

        const err = checkExceptions(() => {
          const model = new Model()

          model.prop.nestedProp = 0
        })

        expect(err.property).to.be.equal('nestedProp')
        expect(err.source).to.be.equal('Prop')
        expect(err.code).to.be.equal('type')
      })
    })
  })

  function checkExceptions(fn) {
    let err = {}

    try {
      fn()
    } catch (e) {
      err = e
    }

    return err
  }

  function testTrigger(name) {
    return function () {
      let property, value, oldValue
      const Model = SmartModel.create('Model', {
        prop: { default: 'old value' }
      }, {}, {
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

}
