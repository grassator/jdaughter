import { Decoder } from "../dist";

export type DecodeErrorStrategy = (message: string, value: any) => any;

export const throwOnError = (message: string) => {
  throw new TypeError(message);
};

export type Decoder<Value> = (
  value: any,
  errorStrategy: DecodeErrorStrategy
) => Value;

function decodePrimitive<Value>(
  type: "boolean" | "number" | "string"
): Decoder<Value> {
  return (value, errorStrategy) => {
    if (typeof value !== type) {
      return errorStrategy(
        `Expected value to be an ${type}, got a ${typeof value}`,
        value
      );
    }
    return value;
  };
}

export const boolean: Decoder<boolean> = decodePrimitive("boolean");
export const number: Decoder<number> = decodePrimitive("number");
export const string: Decoder<string> = decodePrimitive("string");

const ISO_8601_REGEX = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;

export const date: Decoder<Date> = (value, errorStrategy) => {
  if (typeof value !== "string" || !ISO_8601_REGEX.test(value)) {
    return errorStrategy(
      `Expected value to be an ISO 8601 string, got: ${value}`,
      value
    );
  }
  return new Date(value);
};

export const null_: Decoder<null> = (value, errorStrategy) => {
  if (value !== null) {
    return errorStrategy(`Expected value to be null, got: ${value}`, value);
  }
  return null;
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

export type DecoderType<T> = T extends Decoder<infer U> ? U : never;

const id = <T>(x: T): T => x;

export const object = <T extends { [Key in keyof T]: Decoder<any> }>(
  definition: T,
  mapName: (name: string) => string = id
): Decoder<{ [Key in keyof T]: DecoderType<T[Key]> }> => {
  // Check for own properties here to avoid doing it in hot path.
  // This also makes sure we have an immutable snapshot of the definition.
  const cleanDefinition = Object.create(null);
  for (const key in definition) {
    if (hasOwnProperty.call(definition, key)) {
      cleanDefinition[key] = definition[key];
    }
  }

  return (value, errorStrategy) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return errorStrategy(
        `Expected value to be an object, got: ${value}`,
        value
      );
    }

    const result: any = {};
    for (let key in cleanDefinition) {
      result[key] = cleanDefinition[key](value[mapName(key)], errorStrategy);
    }
    return result;
  };
};

export const array = <T>(of: Decoder<T>): Decoder<T[]> => {
  return (value, errorStrategy) => {
    if (!Array.isArray(value)) {
      return errorStrategy(
        `Expected value to be an array, got ${typeof value}`,
        value
      );
    }
    return value.map(item => of(item, errorStrategy));
  };
};

export const dictonary = <T>(
  from: Decoder<string>,
  to: Decoder<T>
): Decoder<{ [key: string]: T }> => {
  return (value, errorStrategy) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return errorStrategy(
        `Expected value to be an object, got: ${value}`,
        value
      );
    }
    const result: { [key: string]: T } = {};
    for (const key in value) {
      if (hasOwnProperty.call(value, key)) {
        const decodedKey = from === string ? key : from(key, errorStrategy);
        result[decodedKey] = to(value[key], errorStrategy);
      }
    }
    return result;
  };
};

export const decode = <T>(decoder: Decoder<T>, value: any) =>
  decoder(value, throwOnError);
