import * as assert from "assert";
import { Decoder as D } from "./index";

describe("jdaughter", () => {
  describe("Type", () => {
    it("should throw when accessed", () => {
      assert.throws(() => {
        return D.null.Type;
      });
    });
  });
  describe("null", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.null.decode(JSON.stringify(null)), null);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.null.decode(JSON.stringify("foo"));
      }, TypeError);
    });
    it("should work as a stand-alone function (and not method)", () => {
      const decode = D.null.decode;
      assert.strictEqual(decode(JSON.stringify(null)), null);
    });
  });
  describe("number", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.number.decode("42"), 42);
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.number.decode(JSON.stringify("foo"));
      }, TypeError);
    });
    it("should work as a stand-alone function (and not method)", () => {
      const decode = D.number.decode;
      assert.strictEqual(decode(JSON.stringify(42)), 42);
    });
  });
  describe("string", () => {
    it("should correctly parse", () => {
      assert.strictEqual(D.string.decode('"foo"'), "foo");
    });
    it("should throw when it does not parse", () => {
      assert.throws(() => {
        D.string.decode(JSON.stringify(false));
      }, TypeError);
    });
    it("should work as a stand-alone function (and not method)", () => {
      const decode = D.string.decode;
      assert.strictEqual(decode(JSON.stringify("foo")), "foo");
    });
  });
  describe("Date", () => {
    it("should correctly parse timezone ISO 8601 dates", () => {
      const date = new Date("2012-04-21T18:25:43-05:00");
      assert.deepStrictEqual(
        D.date.decode(JSON.stringify(date.toISOString())),
        date
      );
    });
    it("should throw when it does not parse an arbitrary string", () => {
      assert.throws(() => {
        D.date.decode(JSON.stringify(false));
      }, TypeError);
    });
    it("should work as a stand-alone function (and not method)", () => {
      const date = new Date("2012-04-21T18:25:43-05:00");
      const decode = D.date.decode;
      assert.deepStrictEqual(decode(JSON.stringify(date.toISOString())), date);
    });
  });
  describe("array", () => {
    it("should correctly parse", () => {
      assert.deepStrictEqual(
        D.array(D.number).decode(JSON.stringify([1, 2, 3])),
        [1, 2, 3]
      );
    });
    it("should throw when it the value is not an array", () => {
      assert.throws(() => {
        D.array(D.number).decode(JSON.stringify(32));
      }, TypeError);
    });
    it("should throw when it is not an array of wrong elements", () => {
      assert.throws(() => {
        D.array(D.number).decode(JSON.stringify(["foo", "bar"]));
      }, TypeError);
    });
    it("should work as a stand-alone function (and not method)", () => {
      const decode = D.array(D.number).decode;
      assert.deepStrictEqual(decode(JSON.stringify([1, 2, 3])), [1, 2, 3]);
    });
  });
  describe("object", () => {
    it("should support empty object parsing", () => {
      assert.deepStrictEqual(D.object.decode(JSON.stringify({})), {});
    });
    it("should throw when it is a primitive type", () => {
      assert.throws(() => {
        D.object.decode(JSON.stringify(123));
      }, TypeError);
    });
    it("should throw when it is an array", () => {
      assert.throws(() => {
        D.object.decode(JSON.stringify([1, 2]));
      }, TypeError);
    });
    it("should support objects with fields", () => {
      const expected = {
        bar: [true, false],
        buzz: "fsdf",
        foo: 42
      };
      assert.deepStrictEqual(
        D.object
          .field("foo", D.number)
          .field("bar", D.array(D.boolean))
          .field("buzz", D.string)
          .decode(JSON.stringify(expected)),
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
        D.object.field("buzz", D.string).decode(JSON.stringify(expected)),
        { buzz: "asdf" }
      );
    });
    it("should work as a stand-alone function (and not method)", () => {
      const decode = D.object.field("buzz", D.string).decode;
      const expected = {
        buzz: "asdf"
      };
      assert.deepStrictEqual(decode(JSON.stringify(expected)), expected);
    });
    it("should support name mapping", () => {
      const expected = {
        prefix_buzz: "asdf"
      };
      assert.deepStrictEqual(
        D.object
          .field("buzz", D.string, name => `prefix_${name}`)
          .decode(JSON.stringify(expected)),
        { buzz: "asdf" }
      );
    });
  });
  describe("map", () => {
    it("should support objects as maps from strings to values", () => {
      const value = {
        bar: 20,
        foo: 10
      };
      assert.deepStrictEqual(
        D.map(D.string, D.number).decode(JSON.stringify(value)),
        value
      );
    });
    it("should support objects as maps from numbers to values", () => {
      const value = {
        10: "a",
        20: "b"
      };
      assert.deepStrictEqual(
        D.map(D.number, D.string).decode(JSON.stringify(value)),
        value
      );
    });
    it("should throw values of the fields do not match", () => {
      assert.throws(() => {
        D.map(D.string, D.number).decode(JSON.stringify({ foo: "bar" }));
      }, TypeError);
    });
  });
  describe("custom", () => {
    const decoder = (value: any): number[] => {
      const raw = D.string.decodeParsed(value);
      return raw.split(",").map(Number);
    };
    it("should support custom decoders", () => {
      assert.deepStrictEqual(D.custom(decoder).decode('"1,2,3"'), [1, 2, 3]);
    });
    it("should throw if custom decoder function throws", () => {
      assert.throws(() => {
        D.custom(decoder).decode("123");
      }, TypeError);
    });
  });
  describe("decodeParsed", () => {
    it("should transform the values as specified", () => {
      const date = new Date("2012-04-21T18:25:43-05:00");
      assert.deepEqual(D.date.decodeParsed(date.toISOString()), date);
    });
    it("should throw when it does not parse an arbitrary string", () => {
      assert.throws(() => {
        D.date.decodeParsed("asdf");
      }, TypeError);
    });
    it("should work as a stand-alone function (and not method)", () => {
      const decode = D.boolean.decodeParsed;
      assert.strictEqual(decode(false), false);
    });
  });
});
