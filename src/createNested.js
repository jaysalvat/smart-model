import { pascalCase, isSmartModel, isPlainObject } from './utils.js'
import SmartModel from './SmartModel.js'

export default function createNested(entry = {}, property, settings) {
  if (!entry.type) {
    return false
  }

  const Child = isSmartModel(entry.type) ? entry.type : false
  const schema = isPlainObject(entry.type) ? entry.type : false

  if (Child || schema) {
    const Model = Child ? Child : SmartModel.create(pascalCase(property), schema, settings)

    entry.type = Model

    return Model
  }

  return false
}
