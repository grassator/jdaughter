import * as assert from 'assert'
import { decoder } from './index'

describe('jdaughter', () => {
  describe('null', () => {
    it('should correctly parse', () => {
      assert.strictEqual(decoder('null').decode('null'), null)
    })
    it('should throw when it does not parse', () => {
      assert.throws(() => {
        decoder('null').decode('"foo"')
      }, TypeError)
    })
  })
  describe('number', () => {
    it('should correctly parse', () => {
      assert.strictEqual(decoder('number').decode('42'), 42)
    })
    it('should throw when it does not parse', () => {
      assert.throws(() => {
        decoder('number').decode('"foo"')
      }, TypeError)
    })
  })
  describe('string', () => {
    it('should correctly parse', () => {
      assert.strictEqual(decoder('string').decode('"foo"'), 'foo')
    })
    it('should throw when it does not parse', () => {
      assert.throws(() => {
        decoder('string').decode('false')
      }, TypeError)
    })
  })
  describe('Date', () => {
    it('should correctly parse timezone ISO 8601 dates', () => {
      assert.deepEqual(
        decoder('date').decode('2012-04-21T18:25:43-05:00'),
        new Date('2012-04-21T18:25:43-05:00')
      )
    })
    it('should throw when it does not parse an arbitrary string', () => {
      assert.throws(() => {
        decoder('date').decode('false')
      }, TypeError)
    })
  })
})
