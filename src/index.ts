type PrimitiveTypeNames = 'null' | 'boolean' | 'number' | 'string' | 'date' | 'array' | 'object'

export interface IDecoder<Value> {
  readonly Type: Value

  /** @throws TypeError in case decoding fails */
  decode (json: string): Value
}

export class ObjectDecoder<Value> implements IDecoder<Value> {
  readonly Type: Value

  /** @throws TypeError in case value checking fails */
  ensure: (value: any) => Value

  protected constructor () {}

  /** @throws TypeError in case value checking fails */
  decode (json: string): Value {
    return this.ensure(JSON.parse(json))
  }

  field <Prev, FieldValue, Key extends string> (this: ObjectDecoder<Prev>, name: Key, fieldValue: Decoder<FieldValue>)
  : ObjectDecoder<Prev & {[key in Key]: FieldValue}> {
    return 0 as any
  }
}

export class Decoder<Value> implements IDecoder<Value> {
  static object: ObjectDecoder<{}> = Object.assign(Object.create(ObjectDecoder.prototype), {
    ensure: objectChecker
  })

  static null: Decoder<null> = Object.assign(Object.create(Decoder.prototype), {
    ensure (value: any): null {
      if (value !== null) {
        throw new TypeError(`While decoding JSON, expected a null, got ${value}`)
      }
      return value
    }
  })

  static boolean: Decoder<boolean> = Object.assign(Object.create(Decoder.prototype), {
    ensure: primitiveChecker('boolean')
  })

  static string: Decoder<string> = Object.assign(Object.create(Decoder.prototype), {
    ensure: primitiveChecker('string')
  })

  static number: Decoder<number> = Object.assign(Object.create(Decoder.prototype), {
    ensure: primitiveChecker('number')
  })

  static date: Decoder<null> = Object.assign(Object.create(Decoder.prototype), {
    ensure: dateChecker
  })

  /** @throws TypeError in case value checking fails */
  ensure: (value: any) => Value

  readonly Type: Value
  protected constructor () {}

  /** @throws TypeError in case value checking fails */
  decode (json: string): Value {
    return this.ensure(JSON.parse(json))
  }
}

Decoder.object
  .field('foo', Decoder.null)
  .field('bar', Decoder.number)
  .field('buzz', Decoder.string)
  .decode('foo')

const ISO_8601_REGEX = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i

// TODO make this more typesafe
function primitiveChecker (type: 'boolean' | 'number' | 'string') {
  return function (value: any) {
    if (typeof value !== type) {
      throw new TypeError(`While decoding JSON, expected a ${type}, got ${value}`)
    }
    return value
  } as any
}

function dateChecker (value: any): Date {
  if (typeof value !== 'string' || !ISO_8601_REGEX.test(value)) {
    throw new TypeError(`While decoding JSON, expected a ISO 8601 date, got ${value}`)
  }

  return new Date(value)
}

function objectChecker (value: any): object {
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`While decoding JSON, expected an object, got ${value}`)
  }
  return value
}

function arrayChecker<T> (elementDecoder: Decoder<T>): (value: any) => T[] {
  return function (value: any): T[] {
    if (!Array.isArray(value)) {
      throw new TypeError(`While decoding JSON, expected an array, got ${value}`)
    }
    for (let i = 0; i < value.length; ++i) {
      (elementDecoder as any)._decode(value[i])
    }
    return value
  }
}
