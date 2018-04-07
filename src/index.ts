export type DecodeErrorStrategy = (message: string, value: any) => any;

export const throwOnError = (message: string) => {
  throw new TypeError(message);
};

export const formatErrorMessage = (
  expectedTypeName: string,
  actual: any,
  path: string
) => {
  const adjustedPath = path === "" ? "." : path;
  const typeOf = typeof actual;
  const actualType =
    typeOf === "object"
      ? actual === null ? "null" : Array.isArray(actual) ? "array" : typeOf
      : typeOf;
  return `Expected value at path \`${adjustedPath}\` to be ${expectedTypeName}, got ${actualType}`;
};

export type Decoder<Value> = (
  value: any,
  errorStrategy: DecodeErrorStrategy,
  path: string
) => Value;

function decodePrimitive<Value>(
  type: "boolean" | "number" | "string" | "undefined"
): Decoder<Value> {
  return (value, errorStrategy, path) => {
    if (typeof value !== type) {
      return errorStrategy(formatErrorMessage(type, value, path), value);
    }
    return value;
  };
}

export const boolean: Decoder<boolean> = decodePrimitive("boolean");
export const number: Decoder<number> = decodePrimitive("number");
export const string: Decoder<string> = decodePrimitive("string");
export const undefined_: Decoder<undefined> = decodePrimitive("undefined");

const ISO_8601_REGEX = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;

export const date: Decoder<Date> = (value, errorStrategy, path) => {
  if (typeof value !== "string" || !ISO_8601_REGEX.test(value)) {
    return errorStrategy(
      formatErrorMessage("ISO 8601 string", value, path),
      value
    );
  }
  return new Date(value);
};

export const null_: Decoder<null> = (value, errorStrategy, path) => {
  if (value !== null) {
    return errorStrategy(formatErrorMessage("null", value, path), value);
  }
  return null;
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

export type DecodedType<T> = T extends Decoder<infer U> ? U : never;

const id = <T>(x: T): T => x;

export const object = <T extends { [Key in keyof T]: Decoder<any> }>(
  definition: T,
  mapName: (name: string) => string = id
): Decoder<{ [Key in keyof T]: DecodedType<T[Key]> }> => {
  // Check for own properties here to avoid doing it in hot path.
  // This also makes sure we have an immutable snapshot of the definition.
  const cleanDefinition = Object.create(null);
  for (const key in definition) {
    if (hasOwnProperty.call(definition, key)) {
      cleanDefinition[key] = definition[key];
    }
  }

  return (value, errorStrategy, path) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return errorStrategy(formatErrorMessage("object", value, path), value);
    }

    const result: any = {};
    for (let key in cleanDefinition) {
      const mappedName = mapName(key);
      result[key] = cleanDefinition[key](
        value[mappedName],
        errorStrategy,
        path + "." + mappedName
      );
    }
    return result;
  };
};

export const array = <T>(of: Decoder<T>): Decoder<T[]> => {
  return (value, errorStrategy, path) => {
    if (!Array.isArray(value)) {
      return errorStrategy(formatErrorMessage("array", value, path), value);
    }
    return value.map((item, index) =>
      of(item, errorStrategy, path + "." + index)
    );
  };
};

export const dictionary = <T>(
  from: Decoder<string>,
  to: Decoder<T>
): Decoder<{ [key: string]: T }> => {
  return (value, errorStrategy, path) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return errorStrategy(formatErrorMessage("object", value, path), value);
    }
    const result: { [key: string]: T } = {};
    for (const key in value) {
      if (hasOwnProperty.call(value, key)) {
        const decodedKey =
          from === string ? key : from(key, errorStrategy, path);
        result[decodedKey] = to(value[key], errorStrategy, path + "." + key);
      }
    }
    return result;
  };
};

const intermediaryError = {
  message: ""
};

const intermediaryErrorStrategy: DecodeErrorStrategy = (message: string) => {
  intermediaryError.message = message;
  return intermediaryError;
};

export const either = <T, U>(a: Decoder<T>, b: Decoder<U>): Decoder<T | U> => {
  return (value, errorStrategy, path) => {
    const aResult: any = a(value, intermediaryErrorStrategy, path);
    if (aResult !== intermediaryError) {
      return aResult;
    }
    const message = aResult.message;
    const bResult: any = b(value, intermediaryErrorStrategy, path);
    if (bResult !== intermediaryError) {
      return bResult;
    }
    return errorStrategy(`Either: ${message} or ${bResult.message}`, value);
  };
};

export const always = <T>(value: T): Decoder<T> => () => value;

export const decode = <T>(decoder: Decoder<T>, value: any) =>
  decoder(value, throwOnError, "");
