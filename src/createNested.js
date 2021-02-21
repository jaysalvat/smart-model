import { pascalCase } from './utils.js'
import SmartModel from './SmartModel.js'

export default function createNested(entry = {}, property, settings) {
  if (!entry.type) {
    return false
  }

  const Child = entry.type.prototype instanceof SmartModel ? entry.type : false
  const schema = typeof entry.type === 'object' ? entry.type : false

  if (Child || schema) {
    return Child ? Child : SmartModel.create(pascalCase(property), schema, settings)
  }

  return false
}
