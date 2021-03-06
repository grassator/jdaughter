import * as assert from "assert";
import * as D from "./index";

describe("jdaughter", () => {
  describe("boolean", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.decode(D.boolean, true), true);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.decode(D.string, true);
      }, TypeError);
    });
  });
  describe("number", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.decode(D.number, 42), 42);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.decode(D.number, "foo");
      }, TypeError);
    });
  });
  describe("string", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.decode(D.string, "foo"), "foo");
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.decode(D.string, 42);
      }, TypeError);
    });
  });
  describe("Date", () => {
    it("should correctly parse timezone ISO 8601 dates", () => {
      const date = new Date("2012-04-21T18:25:43-05:00");
      assert.deepStrictEqual(D.decode(D.date, date.toISOString()), date);
    });
    it("should throw when it does not parse an arbitrary string", () => {
      assert.throws(() => {
        D.decode(D.date, false);
      }, TypeError);
    });
  });
  describe("null", () => {
    it("should correctly decode", () => {
      assert.strictEqual(D.decode(D.null_, null), null);
    });
    it("should throw when it does not decode", () => {
      assert.throws(() => {
        D.decode(D.null_, {});
      }, TypeError);
    });
  });
  describe("undefined", () => {
    it("should correctly decode", () => {
      assert.strictEqual(D.decode(D.undefined_, undefined), undefined);
    });
    it("should throw when it does not decode", () => {
      assert.throws(() => {
        D.decode(D.undefined_, null);
      }, TypeError);
    });
  });
  describe("array", () => {
    it("should correctly parse", () => {
      assert.deepStrictEqual(D.decode(D.array(D.number), [1, 2, 3]), [1, 2, 3]);
    });
    it("should throw when it the value is not an array", () => {
      assert.throws(() => {
        D.decode(D.array(D.number), 32);
      }, TypeError);
    });
    it("should throw when it is not an array of wrong elements", () => {
      assert.throws(() => {
        D.decode(D.array(D.number), ["foo", "bar"]);
      }, TypeError);
    });
    it("should correctly modify path for reported errors", () => {
      try {
        D.decode(D.array(D.string), ["foo", 42]);
      } catch (e) {
        assert.strictEqual(
          e.message,
          "Expected value at path `.1` to be string, got number"
        );
      }
    });
  });
  describe("object", () => {
    it("should support empty object parsing", () => {
      assert.deepStrictEqual(D.decode(D.object({}), {}), {});
    });
    it("should throw when it is a primitive type", () => {
      assert.throws(() => {
        D.decode(D.object({}), 123);
      }, TypeError);
    });
    it("should throw when it is an array", () => {
      assert.throws(() => {
        D.decode(D.object({}), [1, 2]);
      }, TypeError);
    });
    it("should support objects with fields", () => {
      const expected = {
        bar: [true, false],
        buzz: "fsdf",
        foo: 42
      };
      assert.deepStrictEqual(
        D.decode(
          D.object({
            foo: D.number,
            bar: D.array(D.boolean),
            buzz: D.string
          }),
          expected
        ),
        expected
      );
    });
    it("should only return fields that are requested", () => {
      const expected = {
        bar: [true, false],
        buzz: "asdf",
        foo: 42
      };
      assert.deepStrictEqual(D.decode(D.object({ buzz: D.string }), expected), {
        buzz: "asdf"
      });
    });
    it("should support name mapping", () => {
      const expected = {
        prefix_buzz: "asdf"
      };
      assert.deepStrictEqual(
        D.decode(
          D.object({ buzz: D.string }, name => `prefix_${name}`),
          expected
        ),
        { buzz: "asdf" }
      );
    });
    it("should correctly modify path for reported errors", () => {
      try {
        D.decode(D.object({ buzz: D.string }, name => `prefix_${name}`), {
          prefix_buzz: null
        });
      } catch (e) {
        assert.strictEqual(
          e.message,
          "Expected value at path `.prefix_buzz` to be string, got null"
        );
      }
    });
  });
  describe("dict", () => {
    it("should support objects as maps from strings to values", () => {
      const value = {
        bar: 20,
        foo: 10
      };
      assert.deepStrictEqual(
        D.decode(D.dictionary(D.string, D.number), value),
        value
      );
    });
    it("should throw if a value of a field fails to decode", () => {
      assert.throws(() => {
        D.decode(D.dictionary(D.string, D.number), { foo: "bar" });
      }, TypeError);
    });
    it("should correctly modify path for reported errors", () => {
      try {
        D.decode(D.dictionary(D.string, D.number), { foo: "bar" });
      } catch (e) {
        assert.strictEqual(
          e.message,
          "Expected value at path `.foo` to be number, got string"
        );
      }
    });
  });
  describe("either", () => {
    it("should not throw if the first option fails", () => {
      const numberOrString = D.either(D.number, D.string);
      assert.strictEqual(D.decode(numberOrString, "foo"), "foo");
    });
    it("should not throw if the second option fails", () => {
      const numberOrString = D.either(D.number, D.string);
      assert.strictEqual(D.decode(numberOrString, 42), 42);
    });
    it("should throw if both options fail", () => {
      assert.throws(() => {
        D.decode(D.either(D.number, D.string), false);
      }, TypeError);
    });
    it("should support nesting", () => {
      assert.strictEqual(
        D.decode(D.either(D.number, D.either(D.string, D.boolean)), false),
        false
      );
    });
    it("should have readable error messages", () => {
      try {
        D.decode(D.either(D.string, D.number), null);
      } catch (e) {
        assert.strictEqual(
          e.message,
          "Expected value at path `.` to be string or number, got null"
        );
      }
    });
  });
  describe("always", () => {
    it("should succeed with a given value", () => {
      assert.strictEqual(D.decode(D.always(42), null), 42);
    });
  });
  describe("formatErrorMessage", () => {
    it("should distinguish objects and null", () => {
      assert.strictEqual(
        D.formatErrorMessage("object", null, ""),
        "Expected value at path `.` to be object, got null"
      );
    });
    it("should distinguish objects and arrays", () => {
      assert.strictEqual(
        D.formatErrorMessage("object", [], ""),
        "Expected value at path `.` to be object, got array"
      );
    });
    it("should treat empty path as `.`", () => {
      assert.strictEqual(
        D.formatErrorMessage("object", "foobar", ""),
        "Expected value at path `.` to be object, got string"
      );
    });
  });
  describe("GatherErrorsStrategy", () => {
    const decoder = D.object({
      array: D.array(D.number),
      dictionary: D.dictionary(D.string, D.number),
      numberOrString: D.either(D.number, D.string)
    });
    it("should gather all nested errors", () => {
      const strategy = new D.GatherErrorsStrategy();
      const result = decoder(
        {
          array: [42, "foo"],
          dictionary: {
            foo: "bar"
          },
          numberOrString: false
        },
        strategy,
        ""
      );
      assert(strategy.is(result));
      if (strategy.is(result)) {
        assert.deepStrictEqual(strategy.messages, [
          "Expected value at path `.array.1` to be number, got string",
          "Expected value at path `.dictionary.foo` to be number, got string",
          "Expected value at path `.numberOrString` to be number or string, got boolean"
        ]);
      }
    });
  });
});
