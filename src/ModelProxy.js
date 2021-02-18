
// import { isFn, isEqual, checkErrors } from './utils.js'

// import Model from './Model.js'
// import ModelError from './ModelError.js'

// class ModelProxy {
//   #schema;

//   constructor(modelSchema = {}) {
//     this.#schema = modelSchema
    
//     const proxy = new Proxy(this, {

//       // Setter

//       set(target, property, value) {
//         const schema = target.#schema
//         const entry = schema[property]
//         const oldValue = target[property]
//         const updated = !isEqual(value, oldValue)

//         console.log(entry, property, value);

//         function trigger(method) {
//           return Reflect.apply(method, target, [ property, value, oldValue, schema ])
//         }

//         if (isFn(entry)) {
//           return false
//         }

//         if (entry.transform) {
//           value = entry.transform(value)
//         }

//         trigger(target.onBeforeSet)

//         if (updated) {
//           trigger(target.onBeforeUpdate)
//         }

//         if (Model.settings.exeptions) {
//           const errors = checkErrors(entry, property, value)

//           if (errors.length) {
//             errors.forEach((error) => {
//               throw new ModelError({
//                 message: error.message,
//                 property: property,
//                 type: error.type,
//                 value: error.value,
//                 expected: error.expected
//               })
//             })
//           }
//         }

//         target[property] = value

//         trigger(target.onSet)

//         if (updated) {
//           trigger(target.onUpdate)
//         }

//         return true
//       },

//       // Getter

//       get(target, property) {
//         if(target.hasOwnProperty(property)) {
//           return target[property]
//         }
        
//         let value = target[property]
//         const schema = target.#schema
//         const entry = schema[property]

//         if (!entry) {
//           return
//         }

//         function trigger(method, args) {
//           return Reflect.apply(method, target, args)
//         }

//         trigger(target.onBeforeGet, [ property, value, schema ])

//         if (isFn(entry)) {
//           value = trigger(entry, [ target ])
//         }

//         if (isFn(entry.format)) {
//           value = trigger(entry.format, [ value, target ])
//         }

//         trigger(target.onGet, [ property, value, schema ])

//         return value
//       }
//     })

//     return proxy
//   }
// }

// export default ModelProxy
