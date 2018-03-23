function checkPrimitive<Value>(
  type: "boolean" | "number" | "string"
): (value: any) => Value {
  return (value: any) => {
    if (typeof value !== type) {
      throw new TypeError(
        `Expected value to be an ${type}, got ${typeof value}`
      );
    }
    return value;
  };
}

const ISO_8601_REGEX = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;

function bindDecode<T>(d: { decode: (value: any) => T }): void {
  d.decode = d.decode.bind(d);
}

export abstract class AbstractDecoder<Value> {
  get Type(): Value {
    throw new TypeError(
      "`Type` should never be used at runtime and only in `typeof` expression"
    );
  }

  protected constructor() {
    throw new TypeError("`Decoder` should never be constructed directly");
  }

  /** @throws TypeError in case decoding fails */
  public decode(json: string): Value {
    return this.decodeParsed(JSON.parse(json));
  }

  /** @throws TypeError in case decoding fails */
  public abstract decodeParsed(value: any): Value;
}

export class ObjectDecoder<Value> extends AbstractDecoder<Value> {
  public field<Prev, FieldValue, Key extends string>(
    this: ObjectDecoder<Prev>,
    name: Key,
    fieldValue: AbstractDecoder<FieldValue>,
    mapName?: (k: Key) => string
  ): ObjectDecoder<Prev & { [key in Key]: FieldValue }> {
    const decoder: ObjectDecoder<
      Prev & { [key in Key]: FieldValue }
    > = Object.create(ObjectDecoder.prototype);
    bindDecode(decoder);

    decoder.decodeParsed = value => {
      const partialValue = this.decodeParsed(value) as any;
      const mappedName = typeof mapName === "function" ? mapName(name) : name;
      partialValue[name] = (fieldValue as any).decodeParsed(value[mappedName]);
      return partialValue;
    };

    return decoder;
  }

  public decodeParsed(value: any): Value {
    if (typeof value !== "object") {
      throw new TypeError(
        `Expected value to be an object, got ${typeof value}`
      );
    }
    if (Array.isArray(value)) {
      throw new TypeError("Expected value to be an object, got an array");
    }
    return {} as any;
  }
}

export class Decoder<Value> extends AbstractDecoder<Value> {
  public static boolean: Decoder<boolean> = Object.assign(
    Object.create(Decoder.prototype),
    {
      decodeParsed: checkPrimitive("boolean")
    }
  );

  public static number: Decoder<number> = Object.assign(
    Object.create(Decoder.prototype),
    {
      decodeParsed: checkPrimitive("number")
    }
  );

  public static string: Decoder<string> = Object.assign(
    Object.create(Decoder.prototype),
    {
      decodeParsed: checkPrimitive("string")
    }
  );

  public static null: Decoder<null> = Object.assign(
    Object.create(Decoder.prototype),
    {
      decodeParsed(value: any): Date {
        if (value !== null) {
          throw new TypeError(`Expected value to be null, got ${typeof value}`);
        }
        return value;
      }
    }
  );

  public static date: Decoder<Date> = Object.assign(
    Object.create(Decoder.prototype),
    {
      decodeParsed(value: any): Date {
        if (typeof value !== "string" || !ISO_8601_REGEX.test(value)) {
          throw new TypeError(
            `Expected value to be an ISO 8601 string, got ${typeof value}`
          );
        }
        return new Date(value);
      }
    }
  );

  public static object: ObjectDecoder<object> = Object.create(
    ObjectDecoder.prototype
  );

  public static array<Value>(of: Decoder<Value>): Decoder<Value[]> {
    const decoder: Decoder<Value[]> = Object.create(Decoder.prototype);
    bindDecode(decoder);

    decoder.decodeParsed = value => {
      if (!Array.isArray(value)) {
        throw new TypeError(
          `Expected value to be an array, got ${typeof value}`
        );
      }

      return value.map(of.decodeParsed);
    };

    return decoder;
  }

  public static map<Value>(
    from: Decoder<string>,
    to: Decoder<Value>
  ): Decoder<{ [key: string]: Value }>;
  public static map<Value>(
    from: Decoder<number>,
    to: Decoder<Value>
  ): Decoder<{ [key: number]: Value }>;
  public static map<Value>(
    from: Decoder<string | number>,
    to: Decoder<Value>
  ): Decoder<object> {
    const decoder: Decoder<object> = Object.create(Decoder.prototype);
    bindDecode(decoder);

    decoder.decodeParsed = value => {
      Decoder.object.decodeParsed(value);
      const result: { [key: string]: Value } = {};

      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const normalizedKey = from === Decoder.number ? Number(key) : key;
          result[from.decodeParsed(normalizedKey)] = to.decodeParsed(
            value[key]
          );
        }
      }

      return result;
    };

    return decoder;
  }

  public static custom<Value>(decode: (value: any) => Value): Decoder<Value> {
    const decoder: Decoder<Value> = Object.create(Decoder.prototype);
    bindDecode(decoder);
    decoder.decodeParsed = decode;

    return decoder;
  }

  public decodeParsed(value: any): Value {
    throw new TypeError(
      "`decodeParsed` should never be called on non-specialized decoders"
    );
  }
}

[
  Decoder.null,
  Decoder.boolean,
  Decoder.number,
  Decoder.string,
  Decoder.date,
  Decoder.object
].forEach(bindDecode);
