
type PrimitiveTypeNames = 'null' | 'boolean' | 'number' | 'string' | 'date' | 'array' | 'object'

export class Decoder<Value> {
  readonly Type: Value
  protected constructor () {}
  /**
   * @throws TypeError in case decoding fails
   */
  decode (json: string): Value {
    return this._decode(JSON.parse(json))
  }
  private _decode (value: any): Value {
    throw new Error('Not Implemented')
  }
}

function nullChecker (value: any): null {
  if (value !== null) {
    throw new TypeError(`While decoding JSON, expected a null, got ${value}`)
  }
  return value
}

function primitiveChecker (type: 'boolean' | 'number' | 'string') {
  return function (value: any) {
    if (typeof value !== type) {
      throw new TypeError(`While decoding JSON, expected a ${type}, got ${value}`)
    }
    return value
  } as any
}

export class FieldDecoder<Value> extends Decoder<Value> {}

function decoderFactory (of: 'null'): Decoder<null>
function decoderFactory (of: 'boolean'): Decoder<boolean>
function decoderFactory (of: 'number'): Decoder<number>
function decoderFactory (of: 'string'): Decoder<string>
function decoderFactory (of: 'date'): Decoder<Date>
function decoderFactory <T> (of: 'array', next: Decoder<T>): Decoder<T[]>
function decoderFactory <T extends object> (of: 'object', next: FieldDecoder<T>): Decoder<T>
function decoderFactory <T, U> (of: PrimitiveTypeNames, next?: Decoder<U>): Decoder<T> {
  const decoder: Decoder<T> = Object.create(Decoder.prototype)
  if (of === 'null') {
    (decoder as any)._decode = nullChecker
  } else if (of === 'boolean' || of === 'number' || of === 'string') {
    (decoder as any)._decode = primitiveChecker(of)
  }

  return decoder
}

export const decoder = Object.assign(decoderFactory, {
  nil: decoderFactory('null'),
  null: decoderFactory('null'),
  number: decoderFactory('number'),
  string: decoderFactory('string'),
  date: decoderFactory('date')
})

export function field<Value, Key extends string, Next extends object>
  (name: Key, value: Decoder<Value>, next?: FieldDecoder<Next>)
  : FieldDecoder<{[key in Key]: Value} & Next> {
  return { decode: () => 0 } as any
}
