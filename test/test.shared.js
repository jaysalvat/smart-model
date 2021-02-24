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
          prop1: { default: 'Default value1' },
          prop2: { }
        })
        const model = new Model()

        expect(model.prop1).to.be.equal('Default value1')
        expect(model.prop2).to.be.equal(undef)
      })
    })

    // Validations

    describe('Validation', function () {

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

        it('should not throw an error if a required prop is set on init', function () {
          const Model = SmartModel.create('Model', {
            prop: { required: true }
          })

          const err = checkExceptions(() => {
            new Model({ prop: 'string' })
          })

          expect(err.property).to.be.equal(undef)
          expect(err.code).to.be.equal(undef)
        })

        it('should not throw an error if a required prop is not set but have default value on init', function () {
          const Model = SmartModel.create('Model', {
            prop: { required: true, default: 'string' }
          })

          const err = checkExceptions(() => {
            new Model()
          })

          expect(err.property).to.be.equal(undef)
          expect(err.code).to.be.equal(undef)
        })

        it('should throw an error if a required prop is set to empty', function () {
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

        it('should throw an error if a required prop is deleted', function () {
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
        it('should throw an error if a typed prop is not set properly', function () {
          const Model = SmartModel.create('Model', {
            prop: { required: true, type: String }
          })

          const err = checkExceptions(() => {
            new Model({ prop: 0 })
          })

          expect(err.property).to.be.equal('prop')
          expect(err.code).to.be.equal('type')
        })

        it('should not throw an error if a typed prop is set properly', function () {
          const Model = SmartModel.create('Model', {
            prop: { required: true, type: String }
          })

          const err = checkExceptions(() => {
            new Model({ prop: 'string' })
          })

          expect(err.property).to.be.equal(undef)
          expect(err.code).to.be.equal(undef)
        })

        it('should not throw an error if multiple typed props is set properly', function () {
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

        it('should not throw an error if a typed prop is set on a not required property', function () {
          const Model = SmartModel.create('Model', {
            prop: { type: String }
          })

          const err = checkExceptions(() => {
            new Model()
          })

          expect(err.property).to.be.equal(undef)
          expect(err.code).to.be.equal(undef)
        })

        it('should be alright with all those type checks', function () {
          const TestModel = SmartModel.create('Test', {})
          const testModel = new TestModel()

          const types = [
            { type: Date, fail: 100, success: new Date() },
            { type: String, fail: 0, success: 'string' },
            { type: Object, fail: 'string', success: {} },
            { type: Number, fail: 'string', success: 100 },
            { type: Boolean, fail: 'string', success: true },
            { type: Function, fail: 'string', success: function () { } },
            { type: TestModel, fail: 'string', success: testModel },
            { type: SmartModel, fail: {}, success: testModel },
            { type: Array, fail: {}, success: [] }
          ]

          types.forEach((type) => {
            expect(() => {
              const Model = SmartModel.create('Model', {
                prop: { type: type.type, default: type.fail }
              })

              new Model()
            }).to.throw('type')

            expect(() => {
              const Model = SmartModel.create('Model', {
                prop: { type: type.type, default: type.success }
              })

              new Model()
            }).to.not.throw('type')
          })
        })
      })

      // // Rule

      describe('Rule', function () {
        it('should throw an error if a ruled prop is not set properly', function () {
          const Model = SmartModel.create('Model', {
            prop: {
              required: true, rule: {
                min: (value) => value < 5
              }
            }
          })

          const err = checkExceptions(() => {
            new Model({ prop: 0 })
          })

          expect(err.property).to.be.equal('prop')
          expect(err.code).to.be.equal('rule:min')
        })

        it('should not throw an error if a ruled prop is set properly', function () {
          const Model = SmartModel.create('Model', {
            prop: {
              required: true, rule: {
                min: (value) => value < 5
              }
            }
          })

          const err = checkExceptions(() => {
            new Model({ prop: 10 })
          })

          expect(err.property).to.be.equal(undef)
          expect(err.code).to.be.equal(undef)
        })

        it('should not throw an error if a ruled prop is set on an empty not required property', function () {
          const Model = SmartModel.create('Model', {
            prop: {
              rule: {
                min: (value) => value < 5
              }
            }
          })

          const err = checkExceptions(() => {
            new Model()
          })

          expect(err.property).to.be.equal(undef)
          expect(err.code).to.be.equal(undef)
        })
      })
    })

    // Format / Transfor

    describe('Format and transform', function () {
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

    // Virtual / Readonly property

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

      it('should throw an exception if property is readonly', function () {
        SmartModel.settings.exceptions.readonly = true

        const Model = SmartModel.create('Model', {
          prop: { default: 'string', readonly: true }
        })

        const model = new Model()

        const err = checkExceptions(() => {
          model.prop = 'another string'
        })

        expect(err.code).to.be.equal('readonly')
        expect(err.property).to.be.equal('prop')
      })
    })

    // Events

    describe('Hooks', function () {
      it('should trigger $onBeforeDelete', testTrigger('$onBeforeDelete'))
      it('should trigger $onBeforeGet', testTrigger('$onBeforeGet'))
      it('should trigger $onBeforeSet', testTrigger('$onBeforeSet'))
      it('should trigger $onBeforeUpdate', testTrigger('$onBeforeUpdate'))
      it('should trigger $onDelete', testTrigger('$onDelete'))
      it('should trigger $onGet', testTrigger('$onGet'))
      it('should trigger $onSet', testTrigger('$onSet'))
      it('should trigger $onUpdate', testTrigger('$onUpdate'))

      it('should intercept set', () => {
        let isIntercepted
        const Model = SmartModel.create('Model', {
          prop: { default: 'default string' }
        }, {
          methods: {
            $onBeforeSet() {
              return 'INTERCEPTED'
            },

            $onSet(_, val) {
              isIntercepted = val === 'INTERCEPTED'
            }
          }
        })

        const model = new Model()

        expect(model.prop).to.be.equal('INTERCEPTED')
        expect(isIntercepted).to.be.equal(true)
      })

      it('should intercept update', () => {
        let isIntercepted
        const Model = SmartModel.create('Model', {
          prop: { default: 'default string' }
        }, {
          methods: {
            $onBeforeUpdate() {
              return 'INTERCEPTED'
            },

            $onUpdate(_, val) {
              isIntercepted = val === 'INTERCEPTED'
            }
          }
        })

        const model = new Model()

        model.prop = 'updated'

        expect(model.prop).to.be.equal('INTERCEPTED')
        expect(isIntercepted).to.be.equal(true)
      })

      it('should intercept get', () => {
        let isIntercepted
        const Model = SmartModel.create('Model', {
          prop: { default: 'default string' }
        }, {
          methods: {
            $onBeforeGet() {
              return 'INTERCEPTED'
            },

            $onGet(_, val) {
              isIntercepted = val === 'INTERCEPTED'
            }
          }
        })

        const model = new Model()

        expect(model.prop).to.be.equal('INTERCEPTED')
        expect(isIntercepted).to.be.equal(true)
      })
    })

    // Methods

    describe('Methods', function () {
      describe('$put', function () {
        it('should replace model data', function () {
          const Model = SmartModel.create('Model', {
            prop1: { default: 'string1' },
            prop2: { default: 'string2' },
            prop3: {
              type: {
                nestedProp1: { default: 'string3' },
                nestedProp2: { default: 'string4' }
              }
            }
          })

          const model = new Model()

          model.$put({
            prop1: 'newString1',
            prop3: {
              nestedProp1: 'newString2',
              new: 'string'
            },
            new: 'string'
          })

          expect(model.prop1).to.be.equal('newString1')
          expect(model.prop2).to.be.equal(undef)
          expect(model.new).to.be.equal('string')
          expect(model.prop3.nestedProp1).to.be.equal('newString2')
          expect(model.prop3.nestedProp2).to.be.equal(undef)
          expect(model.prop3.new).to.be.equal('string')
        })
      })

      describe('$patch', function () {
        it('should replace model data', function () {
          const Model = SmartModel.create('Model', {
            prop1: { default: 'string1' },
            prop2: { default: 'string2' },
            prop3: {
              type: {
                nestedProp1: { default: 'string3' },
                nestedProp2: { default: 'string4' }
              }
            }
          })

          const model = new Model()

          model.$patch({
            prop1: 'newString1',
            prop3: {
              nestedProp1: 'newString2',
              new: 'string'
            },
            new: 'string'
          })

          expect(model.prop1).to.be.equal('newString1')
          expect(model.prop2).to.be.equal('string2')
          expect(model.new).to.be.equal('string')
          expect(model.prop3.nestedProp1).to.be.equal('newString2')
          expect(model.prop3.nestedProp2).to.be.equal('string4')
          expect(model.prop3.new).to.be.equal('string')
        })
      })

      describe('$delete', function () {
        it('should delete one property', function () {
          const Model = SmartModel.create('Model', {
            prop1: { default: 'string1' },
            prop2: { default: 'string2' }
          })

          const model = new Model()

          model.$delete('prop2')

          expect(model.prop1).to.be.equal('string1')
          expect(model.prop2).to.be.equal(undef)
        })

        it('should delete an array of properties', function () {
          const Model = SmartModel.create('Model', {
            prop1: { default: 'string1' },
            prop2: { default: 'string2' },
            prop3: { default: 'string3' }
          })

          const model = new Model()

          model.$delete([ 'prop2', 'prop3' ])

          expect(model).have.own.property('prop1')
          expect(model).not.have.own.property('prop2')
          expect(model).not.have.own.property('prop3')
        })
      })

      describe('$eject', function () {
        it('should works', function () {
          const Model = SmartModel.create('Model', {
            prop1: { default: 'string1' },
            prop2: {
              type: {
                nestedProp: { default: 'string2' }
              }
            }
          })

          const model = new Model()
          const obj = model.$eject()

          expect(JSON.stringify(obj)).to.be.deep.equal(JSON.stringify(model))
          expect(model).to.be.instanceOf(SmartModel)
          expect(model.prop2).to.be.instanceOf(SmartModel)
          expect(obj).to.not.be.instanceOf(SmartModel)
          expect(obj.prop2).to.not.be.instanceOf(SmartModel)
        })
      })
    })

    describe('Static methods', function () {
      describe('$check', function () {
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

          const errrors = Model.$check({
            prop2: 0,
            prop3: 'string',
            prop4: -1
          })

          const errorProperties = Object.keys(errrors)

          expect(errorProperties.length).to.be.equal(3)
          expect(errrors.prop1[0].code).to.be.equal('required')
          expect(errrors.prop2[0].code).to.be.equal('type')
          expect(errrors.prop4[0].code).to.be.equal('rule:min')
          expect(errrors.prop4[1].code).to.be.equal('rule:pos')
        })

        it('should return an array of model errors without type', function () {
          const Model = SmartModel.create('Model', {
            prop1: { type: String, required: true },
            prop2: { type: String },
            prop3: { type: String, required: true },
            prop4: { type: String }
          })

          const errrors = Model.$check({
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

          const errrors = Model.$check({
            prop1: 'string',
            prop3: 'string'
          })

          expect(errrors).to.be.equal(false)
        })

        it('should return an array of model errors with readonly error', function () {
          const Model = SmartModel.create('Model', {
            prop: { type: String, readonly: true }
          })

          const errrors = Model.$check({
            prop: 'string'
          })

          expect(errrors.prop[0].code).to.be.equal('readonly')
        })
      })

      describe('$hydrate', function () {
        it('should hydrate a object', function () {
          const obj = {
            prop1: 'string'
          }

          const Model = SmartModel.create('Model', {
            prop1: { format: (value) => 'format: ' + value },
            prop2: { default: 'default' }
          })

          const model = Model.$hydrate(obj)

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

          const models = Model.$hydrate(objs)

          models.forEach((model, i) => {
            expect(model.prop1).to.be.equal('format: string ' + (i + 1))
            expect(model.prop2).to.be.equal('default')
          })
        })
      })
    })

    // Settings

    describe('Settings', function () {
      it('should set settings for all instances', function () {
        SmartModel.settings.strict = true
        SmartModel.settings.exceptions.strict = false

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
            prop: { required: true }
          }, {
            exceptions: false
          })

          expect(() => {
            new Model()
          }).to.not.throw(Error)
        })

        it('should throw errors if exceptions:true', function () {
          const Model = SmartModel.create('Model', {
            prop: { required: true }
          }, {
            exceptions: true
          })

          expect(() => {
            new Model()
          }).to.throw(Error)
        })

        it('should not throw errors if exceptions.required:false', function () {
          const Model = SmartModel.create('Model', {
            prop: { required: true }
          }, {
            exceptions: {
              required: false
            }
          })

          expect(() => {
            new Model()
          }).to.not.throw(Error)
        })

        it('should not throw errors if exceptions.type:false', function () {
          const Model = SmartModel.create('Model', {
            prop: { type: String }
          }, {
            exceptions: {
              type: false
            }
          })

          expect(() => {
            new Model({ prop: 0 })
          }).to.not.throw(Error)
        })

        it('should not throw errors if exceptions.strict:false', function () {
          const Model = SmartModel.create('Model', {
            prop1: { type: String }
          }, {
            exceptions: {
              strict: false
            }
          })

          expect(() => {
            new Model({ prop2: 'ok' })
          }).to.not.throw(Error)
        })

        it('should not throw errors if exceptions.rule:false', function () {
          const Model = SmartModel.create('Model', {
            prop: { rule: { min: (value) => value < 2 } }
          }, {
            exceptions: {
              rule: false
            }
          })

          expect(() => {
            new Model({ prop: 1 })
          }).to.not.throw(Error)
        })
      })

      describe('Methods', function () {
        it('should add methods to instance', function () {
          const Model = SmartModel.create('Model', {
            prop: { type: String }
          }, {
            methods: {
              myMethods(param) {
                return this.prop + ':' + param
              }
            }
          })

          const model = new Model({
            prop: 'string'
          })

          expect(model.myMethods('param')).to.be.equal('string:param')
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

      it('should nest a child model and init it properly', function () {
        const Model = SmartModel.create('Model', {
          prop: {
            type: {
              nestedProp: {
                default: 'string'
              }
            }
          }
        })

        const model = new Model({
          prop: {}
        })

        expect(model.prop.nestedProp).to.be.equal('string')
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
      }, {
        methods: {
          [name](prop, val, oldVal) {
            property = prop
            value = val
            oldValue = oldVal
          }
        }
      })

      const model = new Model()

      model.prop = 'new value'

      if ([ '$onBeforeDelete', '$onDelete' ].includes(name)) {
        delete model.prop

        expect(property).to.be.equal('prop')

      } else if ([ '$onBeforeGet', '$onGet' ].includes(name)) {
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
