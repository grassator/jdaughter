export interface DecodeErrorStrategy<T> {
  report(expected: string, actual: any, path: string): T;
  is(value: any): value is T;
}

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

export const throwOnError: DecodeErrorStrategy<never> = {
  report: (expected: string, actual: any, path: string) => {
    throw new TypeError(formatErrorMessage(expected, actual, path));
  },
  is: (value): value is never => false
};

export type Decoder<TValue> = <TError>(
  value: any,
  errorStrategy: DecodeErrorStrategy<TError>,
  path: string
) => TValue | TError;

function decodePrimitive<Value>(
  type: "boolean" | "number" | "string" | "undefined"
): Decoder<Value> {
  return (value, errorStrategy, path) => {
    if (typeof value !== type) {
      return errorStrategy.report(type, value, path);
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
    return errorStrategy.report("ISO 8601 string", value, path);
  }
  return new Date(value);
};

export const null_: Decoder<null> = (value, errorStrategy, path) => {
  if (value !== null) {
    return errorStrategy.report("null", value, path);
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
      return errorStrategy.report("object", value, path);
    }

    let hasErrors = false;
    const result: any = {};
    for (let key in cleanDefinition) {
      const mappedName = mapName(key);
      const decoded = cleanDefinition[key](
        value[mappedName],
        errorStrategy,
        path + "." + mappedName
      );
      if (errorStrategy.is(decoded)) {
        hasErrors = true;
        continue;
      }
      result[key] = decoded;
    }
    if (hasErrors) {
      return errorStrategy.report("array", value, path);
    }
    return result;
  };
};

export const array = <T>(of: Decoder<T>): Decoder<T[]> => {
  return (value, errorStrategy, path) => {
    if (!Array.isArray(value)) {
      return errorStrategy.report("array", value, path);
    }
    let hasErrors = false;
    const result = [];
    for (let i = 0; i < value.length; ++i) {
      const decoded = of(value[i], errorStrategy, path + "." + i);
      if (errorStrategy.is(decoded)) {
        hasErrors = true;
        continue;
      }
      result.push(decoded);
    }
    if (hasErrors) {
      return errorStrategy.report("array", value, path);
    }
    return result;
  };
};

export const dictionary = <T>(
  from: Decoder<string>,
  to: Decoder<T>
): Decoder<{ [key: string]: T }> => {
  return (value, errorStrategy, path) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return errorStrategy.report("object", value, path);
    }
    const result: { [key: string]: T } = {};
    let hasErrors = false;
    for (const key in value) {
      if (hasOwnProperty.call(value, key)) {
        const decodedKey = from(key, errorStrategy, path);
        if (errorStrategy.is(decodedKey)) {
          hasErrors = true;
          continue;
        }
        const decoded = to(value[key], errorStrategy, path + "." + key);
        if (errorStrategy.is(decoded)) {
          hasErrors = true;
          continue;
        }
        result[decodedKey] = decoded;
      }
    }
    if (hasErrors) {
      return errorStrategy.report("dictionary", value, path);
    }
    return result;
  };
};

type IntermediaryError = {
  expected: string;
};

const intermediaryError = {
  expected: ""
};

const intermediaryErrorStrategy: DecodeErrorStrategy<IntermediaryError> = {
  report(expected) {
    intermediaryError.expected = expected;
    return intermediaryError;
  },
  is: (value): value is IntermediaryError => value === intermediaryError
};

export const either = <T, U>(a: Decoder<T>, b: Decoder<U>): Decoder<T | U> => {
  return (value, errorStrategy, path) => {
    const aResult = a(value, intermediaryErrorStrategy, path);
    if (!intermediaryErrorStrategy.is(aResult)) {
      return aResult;
    }
    const aExpected = aResult.expected;
    const bResult = b(value, intermediaryErrorStrategy, path);
    if (!intermediaryErrorStrategy.is(bResult)) {
      return bResult;
    }
    return errorStrategy.report(
      `${aExpected} or ${bResult.expected}`,
      value,
      path
    );
  };
};

export const always = <T>(value: T): Decoder<T> => () => value;

export const decode = <T>(decoder: Decoder<T>, value: any) =>
  decoder(value, throwOnError, "");
