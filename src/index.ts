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

export const compileBufferDecoder = <T>(
  descriptor: Descriptor<T>
): BufferDecoder<T> => {
  let source = "return null";
  return new Function("buf", source) as any;
};

export const decodeBuffer = <T>(
  descriptor: Descriptor<T>,
  value: Buffer | Uint8Array
) => {
  const decoder = compileBufferDecoder(descriptor);
  console.log(decoder);
  return decoder(value);
};
