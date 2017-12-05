
type PrimitiveTypeNames = 'null' | 'number' | 'string' | 'date' | 'array' | 'object'

export class Decoder<Value> {
  /**
   * @throws TypeError in case decoding fails
   */
  decode: (json: string) => Value
  readonly Type: Value
  private constructor () {}
}

export class FieldDecoder<Value> {
  decode: (json: string) => Value
  readonly Type: Value
  private constructor () {}
}

function decoderFactory (of: 'null'): Decoder<null>
function decoderFactory (of: 'number'): Decoder<number>
function decoderFactory (of: 'string'): Decoder<string>
function decoderFactory (of: 'date'): Decoder<Date>
function decoderFactory <T> (of: 'array', next: Decoder<T>): Decoder<T[]>
function decoderFactory <T extends object> (of: 'object', next: FieldDecoder<T>): Decoder<T>
function decoderFactory <T, U> (of: PrimitiveTypeNames, next?: Decoder<U>): Decoder<T> {
  return { decode: () => 0 } as any
}

export const decode = Object.assign(decoderFactory, {
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
