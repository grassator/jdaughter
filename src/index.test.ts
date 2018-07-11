import * as assert from "assert";
import * as D from "./index";

function decodeBuffer<T>(descriptor: D.Descriptor<T>, value: any): T {
  return D.decodeBuffer(
    descriptor,
    Buffer.from(JSON.stringify(value), "utf8")
  ) as any;
}

describe("jdaughter", () => {
  describe("boolean", () => {
    it("should correctly parse `true`", () => {
      assert.strictEqual(decodeBuffer(D.boolean, true), true);
    });
    it("should correctly parse `false`", () => {
      assert.strictEqual(decodeBuffer(D.boolean, false), false);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        decodeBuffer(D.boolean, null);
      }, TypeError);
    });
  });
  describe("number", () => {
    it("should correctly parse", () => {
      assert.strictEqual(decodeBuffer(D.number, 42), 42);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        decodeBuffer(D.number, "foo");
      }, TypeError);
    });
  });
  describe("string", () => {
    it("should correctly parse", () => {
      assert.strictEqual(decodeBuffer(D.string, "foo"), "foo");
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        decodeBuffer(D.string, 42);
      }, TypeError);
    });
  });
  describe("null", () => {
    it("should correctly decodeBuffer", () => {
      assert.strictEqual(decodeBuffer(D.null_, null), null);
    });
    it("should throw when it does not decodeBuffer", () => {
      assert.throws(() => {
        decodeBuffer(D.null_, {});
      }, TypeError);
    });
  });
  describe("array", () => {
    it("should correctly parse", () => {
      assert.deepStrictEqual(decodeBuffer(D.array(D.number), [1, 2, 3]), [
        1,
        2,
        3
      ]);
    });
    it("should throw when it the value is not an array", () => {
      assert.throws(() => {
        decodeBuffer(D.array(D.number), 32);
      }, TypeError);
    });
    it("should throw when it is not an array of wrong elements", () => {
      assert.throws(() => {
        decodeBuffer(D.array(D.number), ["foo", "bar"]);
      }, TypeError);
    });
    it("should correctly modify path for reported errors", () => {
      try {
        decodeBuffer(D.array(D.string), ["foo", 42]);
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
      assert.deepStrictEqual(decodeBuffer(D.object({}), {}), {});
    });
    it("should throw when it is a primitive type", () => {
      assert.throws(() => {
        decodeBuffer(D.object({}), 123);
      }, TypeError);
    });
    it("should throw when it is an array", () => {
      assert.throws(() => {
        decodeBuffer(D.object({}), [1, 2]);
      }, TypeError);
    });
    it("should support objects with fields", () => {
      const expected = {
        bar: [true, false],
        buzz: "fsdf",
        foo: 42
      };
      assert.deepStrictEqual(
        decodeBuffer(
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
      assert.deepStrictEqual(
        decodeBuffer(D.object({ buzz: D.string }), expected),
        {
          buzz: "asdf"
        }
      );
    });
    it("should support name mapping", () => {
      const expected = {
        prefix_buzz: "asdf"
      };
      assert.deepStrictEqual(
        decodeBuffer(
          D.object({ buzz: D.string }, name => `prefix_${name}`),
          expected
        ),
        { buzz: "asdf" }
      );
    });
    it("should correctly modify path for reported errors", () => {
      try {
        decodeBuffer(D.object({ buzz: D.string }, name => `prefix_${name}`), {
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
        decodeBuffer(D.dictionary(D.string, D.number), value),
        value
      );
    });
    it("should throw if a value of a field fails to decodeBuffer", () => {
      assert.throws(() => {
        decodeBuffer(D.dictionary(D.string, D.number), { foo: "bar" });
      }, TypeError);
    });
    it("should correctly modify path for reported errors", () => {
      try {
        decodeBuffer(D.dictionary(D.string, D.number), { foo: "bar" });
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
      assert.strictEqual(decodeBuffer(numberOrString, "foo"), "foo");
    });
    it("should not throw if the second option fails", () => {
      const numberOrString = D.either(D.number, D.string);
      assert.strictEqual(decodeBuffer(numberOrString, 42), 42);
    });
    it("should throw if both options fail", () => {
      assert.throws(() => {
        decodeBuffer(D.either(D.number, D.string), false);
      }, TypeError);
    });
    it("should support nesting", () => {
      assert.strictEqual(
        decodeBuffer(D.either(D.number, D.either(D.string, D.boolean)), false),
        false
      );
    });
    it("should have readable error messages", () => {
      try {
        decodeBuffer(D.either(D.string, D.number), null);
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
      assert.strictEqual(decodeBuffer(D.always(42), null), 42);
    });
  });
});
