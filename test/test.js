/* eslint-env mocha */

import chai from 'chai'
import SmartModel from '../src/index.js'
import Model from '../src/Model.js'

const { expect } = chai

describe('SmartModel', function () {

  describe('Init', function () {
    it('should be ok', function () {
      const Post = SmartModel.create('Post', {})
      const post = new Post()

      expect(Post).to. be.an.instanceOf(Function)
      expect(post).to. be.an.instanceOf(SmartModel)
      expect(post).to. be.an.instanceOf(Model)
      expect(post).to. be.an.instanceOf(Post)
    })
  })
})
