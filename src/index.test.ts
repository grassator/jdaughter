import * as assert from 'assert'
import { decode, field } from './index'

describe('jdaughter', () => {
  it('should typecheck', () => {
    const fooBarBuzzDecoder = decode('object',
      field('foo', decode.number,
      field('bar', decode.string,
      field('buzz', decode.number
    ))))
    const value: typeof fooBarBuzzDecoder.Type = fooBarBuzzDecoder.decode('fosodf')
    assert(!(value.foo + value.buzz))
  })
})
