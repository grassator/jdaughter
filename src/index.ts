const DOUBLE_QUOTE = 0x22;
const OPEN_CURLY_BRACE = 0x7b;
const CLOSE_CURLY_BRACE = 0x7d;
const OPEN_SQUARE_BRACE = 0x5b;
const CLOSE_SQUARE_BRACE = 0x5d;
const COLON = 0x3a;
const COMMA = 0x2c;
const MINUS = 0x2d;
const PLUS = 0x2b;
const DOT = 0x2e;

const NUMBER_0 = 0x30;
const NUMBER_1 = 0x31;
const NUMBER_2 = 0x32;
const NUMBER_3 = 0x33;
const NUMBER_4 = 0x34;
const NUMBER_5 = 0x35;
const NUMBER_6 = 0x36;
const NUMBER_7 = 0x37;
const NUMBER_8 = 0x38;
const NUMBER_9 = 0x39;

const LETTER_UPPERCASE_A = 0x41;
const LETTER_UPPERCASE_B = 0x42;
const LETTER_UPPERCASE_C = 0x43;
const LETTER_UPPERCASE_D = 0x44;
const LETTER_UPPERCASE_E = 0x45;
const LETTER_UPPERCASE_F = 0x46;
const LETTER_UPPERCASE_G = 0x47;
const LETTER_UPPERCASE_H = 0x48;
const LETTER_UPPERCASE_I = 0x49;
const LETTER_UPPERCASE_J = 0x4a;
const LETTER_UPPERCASE_K = 0x4b;
const LETTER_UPPERCASE_L = 0x4c;
const LETTER_UPPERCASE_M = 0x4d;
const LETTER_UPPERCASE_N = 0x4e;
const LETTER_UPPERCASE_O = 0x4f;
const LETTER_UPPERCASE_P = 0x50;
const LETTER_UPPERCASE_Q = 0x51;
const LETTER_UPPERCASE_R = 0x52;
const LETTER_UPPERCASE_S = 0x53;
const LETTER_UPPERCASE_T = 0x54;
const LETTER_UPPERCASE_U = 0x55;
const LETTER_UPPERCASE_V = 0x56;
const LETTER_UPPERCASE_W = 0x57;
const LETTER_UPPERCASE_X = 0x58;
const LETTER_UPPERCASE_Y = 0x59;
const LETTER_UPPERCASE_Z = 0x5a;

const LETTER_LOWERCASE_A = 0x61;
const LETTER_LOWERCASE_B = 0x62;
const LETTER_LOWERCASE_C = 0x63;
const LETTER_LOWERCASE_D = 0x64;
const LETTER_LOWERCASE_E = 0x65;
const LETTER_LOWERCASE_F = 0x66;
const LETTER_LOWERCASE_G = 0x67;
const LETTER_LOWERCASE_H = 0x68;
const LETTER_LOWERCASE_I = 0x69;
const LETTER_LOWERCASE_J = 0x6a;
const LETTER_LOWERCASE_K = 0x6b;
const LETTER_LOWERCASE_L = 0x6c;
const LETTER_LOWERCASE_M = 0x6d;
const LETTER_LOWERCASE_N = 0x6e;
const LETTER_LOWERCASE_O = 0x6f;
const LETTER_LOWERCASE_P = 0x70;
const LETTER_LOWERCASE_Q = 0x71;
const LETTER_LOWERCASE_R = 0x72;
const LETTER_LOWERCASE_S = 0x73;
const LETTER_LOWERCASE_T = 0x74;
const LETTER_LOWERCASE_U = 0x75;
const LETTER_LOWERCASE_V = 0x76;
const LETTER_LOWERCASE_W = 0x77;
const LETTER_LOWERCASE_X = 0x78;
const LETTER_LOWERCASE_Y = 0x79;
const LETTER_LOWERCASE_Z = 0x7a;

declare const VALUE_TYPE: unique symbol;

export type DescriptorType =
  | {
      kind: "primitive";
      value: "boolean" | "number" | "string" | "undefined" | "null";
    }
  | {
      kind: "either";
      a: DescriptorType;
      b: DescriptorType;
    }
  | {
      kind: "array";
      value: DescriptorType;
    }
  | {
      kind: "object";
      mapName: (name: string) => string;
      properties: {
        [property: string]: DescriptorType;
      };
    }
  | {
      kind: "dictionary";
      value: DescriptorType;
    }
  | {
      kind: "constant";
      value: any;
    };

export type Descriptor<TValue> = DescriptorType & {
  readonly [VALUE_TYPE]: TValue;
};

function decodePrimitive<Value>(
  value: "boolean" | "number" | "string" | "undefined" | "null"
): Descriptor<Value> {
  return {
    kind: "primitive",
    value
  } as Descriptor<Value>;
}

export const boolean = decodePrimitive<boolean>("boolean");
export const number = decodePrimitive<number>("number");
export const string = decodePrimitive<string>("string");
export const undefined_ = decodePrimitive<undefined>("undefined");
export const null_ = decodePrimitive<null>("null");

const hasOwnProperty = Object.prototype.hasOwnProperty;

export type DecodedType<T> = T extends Descriptor<infer U> ? U : never;

const id = <T>(x: T): T => x;

export const object = <T extends { [Key in keyof T]: Descriptor<any> }>(
  definition: T,
  mapName: (name: string) => string = id
): Descriptor<{ [Key in keyof T]: DecodedType<T[Key]> }> => {
  // Check for own properties here to avoid doing it in hot path.
  // This also makes sure we have an immutable snapshot of the definition.
  const cleanDefinition = Object.create(null);
  for (const key in definition) {
    if (hasOwnProperty.call(definition, key)) {
      cleanDefinition[key] = definition[key];
    }
  }
  return {
    kind: "object",
    properties: cleanDefinition,
    mapName
  } as Descriptor<{ [Key in keyof T]: DecodedType<T[Key]> }>;
};

export const array = <T>(of: Descriptor<T>): Descriptor<T[]> =>
  (({
    kind: "array",
    value: of
  } as any) as Descriptor<T[]>);

export const dictionary = <T>(
  from: Descriptor<string>,
  to: Descriptor<T>
): Descriptor<{ [key: string]: T }> =>
  (({
    kind: "dictionary",
    value: to
  } as any) as Descriptor<{ [key: string]: T }>);

export const either = <T, U>(
  a: Descriptor<T>,
  b: Descriptor<U>
): Descriptor<T | U> =>
  (({
    kind: "either",
    a,
    b
  } as any) as Descriptor<T | U>);

export const always = <T>(value: T): Descriptor<T> =>
  ({
    kind: "constant",
    value
  } as Descriptor<T>);

export type BufferDecoder<T> = <T>(buffer: Buffer | Uint8Array) => T;

let lastErrorMessage = "";
let lastErrorIndex = -1;

const parseError = (message: string, index: number) => {
  lastErrorMessage = message;
  lastErrorIndex = index;
  return -1;
};

type BooleanResult = { _: boolean };
type NumberResult = { _: number };

let booleanResult: BooleanResult = { _: false };
let numberResult: NumberResult = { _: 0.0 };

export function parseBoolean(
  buffer: Buffer,
  index: number,
  result: BooleanResult
): number {
  if (
    buffer.length >= index + 4 /* length of word "true" */ &&
    buffer[index] === LETTER_LOWERCASE_T &&
    buffer[++index] === LETTER_LOWERCASE_R &&
    buffer[++index] === LETTER_LOWERCASE_U &&
    buffer[++index] === LETTER_LOWERCASE_E
  ) {
    result._ = true;
    return index + 1;
  } else if (
    buffer.length >= index + 5 /* length of word "false" */ &&
    buffer[index] === LETTER_LOWERCASE_F &&
    buffer[++index] === LETTER_LOWERCASE_A &&
    buffer[++index] === LETTER_LOWERCASE_L &&
    buffer[++index] === LETTER_LOWERCASE_S &&
    buffer[++index] === LETTER_LOWERCASE_E
  ) {
    result._ = false;
    return index + 1;
  } else {
    return parseError("Expected boolean", index);
  }
}

export function parseNull(buffer: Buffer, index: number): number {
  if (
    buffer.length >= index + 4 /* length of word "null" */ &&
    buffer[index] === LETTER_LOWERCASE_N &&
    buffer[++index] === LETTER_LOWERCASE_U &&
    buffer[++index] === LETTER_LOWERCASE_L &&
    buffer[++index] === LETTER_LOWERCASE_L
  ) {
    return index + 1;
  } else {
    return parseError("Expected null", index);
  }
}

// TODO investigate if it is faster to do parse manually
// complying with https://ecma-international.org/ecma-262/5.1/#sec-9.3.1
export function parseNumber(
  buffer: Buffer,
  index: number,
  result: NumberResult
): number {
  const chars = [];
  while (
    index < buffer.length &&
    ((buffer[index] >= NUMBER_0 && buffer[index] <= NUMBER_9) ||
      buffer[index] === DOT ||
      buffer[index] === LETTER_LOWERCASE_E ||
      buffer[index] === LETTER_UPPERCASE_E ||
      buffer[index] === PLUS ||
      buffer[index] === MINUS)
  ) {
    chars.push(buffer[index++]);
  }
  if (chars.length !== 0) {
    const parsed = parseFloat(String.fromCharCode.apply(String, chars));
    // only NaN is not equal to itself among numbers
    if (parsed === parsed) {
      result._ = parsed;
      return index;
    }
  }
  return parseError("Expected number", index);
}

const hex = (code: number) => `0x${code.toString(16)}`;

function doCompileBufferDecoder(
  descriptor: DescriptorType,
  accept: (value: string) => string,
  abort: () => string
): string {
  if (descriptor.kind === "array") {
    const id = `arr${String(Math.random()).slice(2, 8)}`;
    return `
      if (index >= buffer.length || buffer[index] !== ${hex(
        OPEN_SQUARE_BRACE
      )}) {
        ${abort()}
      }
      ++index;
      var ${id} = [];
      while (true) {
        ${doCompileBufferDecoder(
          descriptor.value,
          value => `${id}.push(${value});`,
          abort
        )}
        if (index >= buffer.length || buffer[index] !== ${hex(COMMA)}) {
          break;
        }
        ++index;
      }
      if (index >= buffer.length || buffer[index] !== ${hex(
        CLOSE_SQUARE_BRACE
      )}) {
        ${abort()}
      }
      ++index;
      ${accept(id)}
    `;
  } else if (descriptor.kind === "primitive") {
    if (descriptor.value === "boolean") {
      return `
        if ((index = parseBoolean(buffer, index, booleanResult)) === -1) {
          ${abort()}
        } else {
          ${accept("booleanResult._")}
        }
      `;
    } else if (descriptor.value === "null") {
      return `
        if ((index = parseNull(buffer, index)) === -1) {
          ${abort()}
        } else {
          ${accept("null")}
        }
      `;
    } else if (descriptor.value === "number") {
      return `
        if ((index = parseNumber(buffer, index, numberResult)) === -1) {
          ${abort()}
        } else {
          ${accept("numberResult._")}
        }
      `;
    }
  }
  throw new TypeError(`descriptor ${descriptor.kind} not supported yet`);
}

export const compileBufferDecoder = <T>(
  descriptor: Descriptor<T>
): BufferDecoder<T> => {
  const body = `return function decode (buffer) {
    var index = 0;
    ${doCompileBufferDecoder(
      descriptor,
      value => `return [index, ${value}];`,
      () => "return [-1];"
    )};
  }`;
  const wrapper = new Function(
    "parseBoolean",
    "booleanResult",
    "parseNumber",
    "numberResult",
    "parseNull",
    body
  );
  return wrapper(
    parseBoolean,
    booleanResult,
    parseNumber,
    numberResult,
    parseNull
  );
};

export const runBufferDecoder = <T>(
  decoder: BufferDecoder<T>,
  buffer: Buffer | Uint8Array
) => {
  lastErrorIndex = -1;
  lastErrorMessage = "";
  const [index, result] = decoder(buffer);

  if (index !== buffer.length) {
    throw new TypeError(`Expected EOF at ${lastErrorIndex}`);
  }

  if (lastErrorIndex !== -1) {
    throw new TypeError(`${lastErrorMessage} at ${lastErrorIndex}`);
  }

  return result;
};

export const decodeBuffer = <T>(
  descriptor: Descriptor<T>,
  buffer: Buffer | Uint8Array
) => {
  return runBufferDecoder(compileBufferDecoder(descriptor), buffer);
};
