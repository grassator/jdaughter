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
    it("should correctly parse", () => {
      assert.strictEqual(D.decode(D.null_, null), null);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.decode(D.null_, {});
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
});
