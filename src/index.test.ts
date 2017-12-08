import * as assert from 'assert'
import { Decoder as D } from './index'

describe('jdaughter', () => {
  describe('Type', () => {
    it('should throw when accessed', () => {
      assert.throws(() => {
        return D.null.Type
      })
    })
  })
  describe('null', () => {
    it('should correctly parse', () => {
      assert.strictEqual(
        D.null.decode(JSON.stringify(null)),
        null
      )
    })
    it('should throw when it does not parse', () => {
      assert.throws(() => {
        D.null.decode(JSON.stringify('foo'))
      }, TypeError)
    })
    it('should work as a stand-alone function (and not method)', () => {
      const decode = D.null.decode
      assert.strictEqual(
        decode(JSON.stringify(null)),
        null
      )
    })
  })
  describe('number', () => {
    it('should correctly parse', () => {
      assert.strictEqual(D.number.decode('42'), 42)
    })
    it('should throw when it does not parse', () => {
      assert.throws(() => {
        D.number.decode(JSON.stringify('foo'))
      }, TypeError)
    })
    it('should work as a stand-alone function (and not method)', () => {
      const decode = D.number.decode
      assert.strictEqual(
        decode(JSON.stringify(42)),
        42
      )
    })
  })
  describe('string', () => {
    it('should correctly parse', () => {
      assert.strictEqual(D.string.decode('"foo"'), 'foo')
    })
    it('should throw when it does not parse', () => {
      assert.throws(() => {
        D.string.decode(JSON.stringify(false))
      }, TypeError)
    })
    it('should work as a stand-alone function (and not method)', () => {
      const decode = D.string.decode
      assert.strictEqual(
        decode(JSON.stringify('foo')),
        'foo'
      )
    })
  })
  describe('Date', () => {
    it('should correctly parse timezone ISO 8601 dates', () => {
      const date = new Date('2012-04-21T18:25:43-05:00')
      assert.deepStrictEqual(
        D.date.decode(JSON.stringify(date.toISOString())),
        date
      )
    })
    it('should throw when it does not parse an arbitrary string', () => {
      assert.throws(() => {
        D.date.decode(JSON.stringify(false))
      }, TypeError)
    })
    it('should work as a stand-alone function (and not method)', () => {
      const date = new Date('2012-04-21T18:25:43-05:00')
      const decode = D.date.decode
      assert.deepStrictEqual(
        decode(JSON.stringify(date.toISOString())),
        date
      )
    })
  })
  describe('array', () => {
    it('should correctly parse', () => {
      assert.deepStrictEqual(
        D.array(D.number).decode(JSON.stringify([1, 2, 3])),
        [1, 2, 3]
      )
    })
    it('should throw when it the value is not an array', () => {
      assert.throws(() => {
        D.array(D.number).decode(JSON.stringify(32))
      }, TypeError)
    })
    it('should throw when it is not an array of wrong elements', () => {
      assert.throws(() => {
        D.array(D.number).decode(JSON.stringify(['foo', 'bar']))
      }, TypeError)
    })
    it('should work as a stand-alone function (and not method)', () => {
      const decode = D.array(D.number).decode
      const expected = {
        buzz: 'asdf'
      }
      assert.deepStrictEqual(
        decode(JSON.stringify([1, 2, 3])),
        [1, 2, 3]
      )
    })
  })
  describe('object', () => {
    it('should support empty object parsing', () => {
      assert.deepStrictEqual(
        D.object.decode(JSON.stringify({})),
        {}
      )
    })
    it('should throw when it is a primitive type', () => {
      assert.throws(() => {
        D.object.decode(JSON.stringify(123))
      }, TypeError)
    })
    it('should throw when it is an array', () => {
      assert.throws(() => {
        D.object.decode(JSON.stringify([1, 2]))
      }, TypeError)
    })
    it('should support objects with fields', () => {
      const expected = {
        foo: 42,
        bar: [true, false],
        buzz: 'fsdf'
      }
      assert.deepStrictEqual(
        D.object
          .field('foo', D.number)
          .field('bar', D.array(D.boolean))
          .field('buzz', D.string)
          .decode(JSON.stringify(expected)),
        expected
      )
    })
    it('should only return fields that are requested', () => {
      const expected = {
        foo: 42,
        bar: [true, false],
        buzz: 'asdf'
      }
      assert.deepStrictEqual(
        D.object
          .field('buzz', D.string)
          .decode(JSON.stringify(expected)),
        { buzz: 'asdf' }
      )
    })
    it('should work as a stand-alone function (and not method)', () => {
      const decode = D.object
        .field('buzz', D.string)
        .decode
      const expected = {
        buzz: 'asdf'
      }
      assert.deepStrictEqual(
        decode(JSON.stringify(expected)),
        expected
      )
    })
  })
  describe('decodeParsed', () => {
    it('should transform the values as specified', () => {
      const date = new Date('2012-04-21T18:25:43-05:00')
      assert.deepEqual(
        D.date.decodeParsed(date.toISOString()),
        date
      )
    })
    it('should throw when it does not parse an arbitrary string', () => {
      assert.throws(() => {
        D.date.decodeParsed('asdf')
      }, TypeError)
    })
    it('should work as a stand-alone function (and not method)', () => {
      const decode = D.boolean.decodeParsed
      assert.strictEqual(decode(false), false)
    })
  })
})
