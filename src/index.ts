function checkPrimitive <Value> (type: 'boolean' | 'number' | 'string')
  : (value: any) => Value {
  return (value: any) => {
    if (typeof value !== type) {
      throw new TypeError(`Expected value to be an object, got ${typeof value}`)
    }
    return value
  }
}

const ISO_8601_REGEX = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i

export abstract class AbstractDecoder<Value> {
  get Type (): Value {
    throw new TypeError('`Type` should never be used at runtime and only in `typeof` expression')
  }

  protected constructor () {
    throw new TypeError('`Decoder` should never be constructed directly')
  }

  /** @throws TypeError in case decoding fails */
  decode (json: string): Value {
    return this.doDecode(JSON.parse(json))
  }

  protected abstract doDecode (value: any): Value
}

export class ObjectDecoder<Value> extends AbstractDecoder<Value> {
  field <Prev, FieldValue, Key extends string> (this: ObjectDecoder<Prev>, name: Key, fieldValue: AbstractDecoder<FieldValue>)
  : ObjectDecoder<Prev & {[key in Key]: FieldValue}> {
    const decoder: ObjectDecoder<Prev & {[key in Key]: FieldValue}> = Object.create(ObjectDecoder.prototype)

    decoder.doDecode = (value) => {
      const partialValue = this.doDecode(value) as any
      partialValue[name] = (fieldValue as any).doDecode(value[name])
      return partialValue
    }

    return decoder
  }

  protected doDecode (value: any): Value {
    if (typeof value !== 'object') {
      throw new TypeError(`Expected value to be an object, got ${typeof value}`)
    }
    if (Array.isArray(value)) {
      throw new TypeError('Expected value to be an object, got an array')
    }
    return {} as any
  }
}

export class Decoder<Value> extends AbstractDecoder<Value> {
  static boolean: Decoder<boolean> = Object.assign(Object.create(Decoder.prototype), {
    doDecode: checkPrimitive('boolean')
  })

  static number: Decoder<number> = Object.assign(Object.create(Decoder.prototype), {
    doDecode: checkPrimitive('number')
  })

  static string: Decoder<string> = Object.assign(Object.create(Decoder.prototype), {
    doDecode: checkPrimitive('string')
  })

  static null: Decoder<null> = Object.assign(Object.create(Decoder.prototype), {
    doDecode (value: any): Date {
      if (value !== null) {
        throw new TypeError(`Expected value to be null, got ${typeof value}`)
      }
      return value
    }
  })

  static date: Decoder<Date> = Object.assign(Object.create(Decoder.prototype), {
    doDecode (value: any): Date {
      if (typeof value !== 'string' || !ISO_8601_REGEX.test(value)) {
        throw new TypeError(`Expected value to be an ISO 8601 string, got ${typeof value}`)
      }
      return new Date(value)
    }
  })

  static object: ObjectDecoder<object> = Object.create(ObjectDecoder.prototype)

  static array <Value> (of: Decoder<Value>): Decoder<Value[]> {
    const decoder: Decoder<Value[]> = Object.create(Decoder.prototype)

    decoder.doDecode = (value) => {
      if (!Array.isArray(value)) {
        throw new TypeError(`Expected value to be an array, got ${typeof value}`)
      }

      return value.map(of.doDecode)
    }

    return decoder
  }

  protected doDecode (value: any): Value {
    throw new TypeError('`doDecode` should never be called directly')
  }
}
