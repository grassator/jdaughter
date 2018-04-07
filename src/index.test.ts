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
  });
  describe("dict", () => {
    it("should support objects as maps from strings to values", () => {
      const value = {
        bar: 20,
        foo: 10
      };
      assert.deepStrictEqual(
        D.decode(D.dictonary(D.string, D.number), value),
        value
      );
    });
    it("should throw if a value of a field fails to decode", () => {
      assert.throws(() => {
        D.decode(D.dictonary(D.string, D.number), { foo: "bar" });
      }, TypeError);
    });
  });
});
