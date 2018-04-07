import * as assert from "assert";
import * as D from "./index";

describe("jdaughter", () => {
  describe("boolean", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.boolean(true, D.throwOnError), true);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.string(true, D.throwOnError);
      }, TypeError);
    });
  });
  describe("number", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.number(42, D.throwOnError), 42);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.number("foo", D.throwOnError);
      }, TypeError);
    });
  });
  describe("string", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.string("foo", D.throwOnError), "foo");
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.string(42, D.throwOnError);
      }, TypeError);
    });
  });
  describe("Date", () => {
    it("should correctly parse timezone ISO 8601 dates", () => {
      const date = new Date("2012-04-21T18:25:43-05:00");
      assert.deepStrictEqual(D.date(date.toISOString(), D.throwOnError), date);
    });
    it("should throw when it does not parse an arbitrary string", () => {
      assert.throws(() => {
        D.date(false, D.throwOnError);
      }, TypeError);
    });
  });
  describe("null", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.null_(null, D.throwOnError), null);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.null_({}, D.throwOnError);
      }, TypeError);
    });
  });
  describe("array", () => {
    it("should correctly parse", () => {
      assert.deepStrictEqual(D.array(D.number)([1, 2, 3], D.throwOnError), [
        1,
        2,
        3
      ]);
    });
    it("should throw when it the value is not an array", () => {
      assert.throws(() => {
        D.array(D.number)(JSON.stringify(32), D.throwOnError);
      }, TypeError);
    });
    it("should throw when it is not an array of wrong elements", () => {
      assert.throws(() => {
        D.array(D.number)(JSON.stringify(["foo", "bar"]), D.throwOnError);
      }, TypeError);
    });
  });
  describe("object", () => {
    it("should support empty object parsing", () => {
      assert.deepStrictEqual(D.object({})({}, D.throwOnError), {});
    });
    it("should throw when it is a primitive type", () => {
      assert.throws(() => {
        D.object({})(123, D.throwOnError);
      }, TypeError);
    });
    it("should throw when it is an array", () => {
      assert.throws(() => {
        D.object({})([1, 2], D.throwOnError);
      }, TypeError);
    });
    it("should support objects with fields", () => {
      const expected = {
        bar: [true, false],
        buzz: "fsdf",
        foo: 42
      };
      assert.deepStrictEqual(
        D.object({
          foo: D.number,
          bar: D.array(D.boolean),
          buzz: D.string
        })(expected, D.throwOnError),
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
        D.object({ buzz: D.string })(expected, D.throwOnError),
        { buzz: "asdf" }
      );
    });
    it("should support name mapping", () => {
      const expected = {
        prefix_buzz: "asdf"
      };
      assert.deepStrictEqual(
        D.object({ buzz: D.string }, name => `prefix_${name}`)(
          expected,
          D.throwOnError
        ),
        { buzz: "asdf" }
      );
    });
  });
  describe("dict", () => {
    it("should support objects as maps from strings to values", () => {
      const value = {
        bar: 20,
        foo: 10
      };
      assert.deepStrictEqual(
        D.dictonary(D.string, D.number)(value, D.throwOnError),
        value
      );
    });
    it("should throw if a value of a field fails to decode", () => {
      assert.throws(() => {
        D.dictonary(D.string, D.number)({ foo: "bar" }, D.throwOnError);
      }, TypeError);
    });
  });
});
