import * as Benchmark from "benchmark";
import { strict as assert } from "assert";

const suite = new Benchmark.Suite();

const data = {
  a: false
};

const DOUBLE_QUOTE = 0x22;
const OPEN_CURLY_BRACE = 0x7b;
const CLOSE_CURLY_BRACE = 0x7d;
const COLON = 0x3a;

const LETTER_UPPERCASE_A = 0x41;
const LETTER_UPPERCASE_B = 0x42;
const LETTER_UPPERCASE_C = 0x43;
const LETTER_UPPERCASE_D = 0x44;
const LETTER_UPPERCASE_E = 0x45;
const LETTER_UPPERCASE_F = 0x46;
const LETTER_UPPERCASE_G = 0x47;
const LETTER_UPPERCASE_H = 0x48;
const LETTER_UPPERCASE_I = 0x49;
const LETTER_UPPERCASE_J = 0x4a;
const LETTER_UPPERCASE_K = 0x4b;
const LETTER_UPPERCASE_L = 0x4c;
const LETTER_UPPERCASE_M = 0x4d;
const LETTER_UPPERCASE_N = 0x4e;
const LETTER_UPPERCASE_O = 0x4f;
const LETTER_UPPERCASE_P = 0x50;
const LETTER_UPPERCASE_Q = 0x51;
const LETTER_UPPERCASE_R = 0x52;
const LETTER_UPPERCASE_S = 0x53;
const LETTER_UPPERCASE_T = 0x54;
const LETTER_UPPERCASE_U = 0x55;
const LETTER_UPPERCASE_V = 0x56;
const LETTER_UPPERCASE_W = 0x57;
const LETTER_UPPERCASE_X = 0x58;
const LETTER_UPPERCASE_Y = 0x59;
const LETTER_UPPERCASE_Z = 0x5a;

const LETTER_LOWERCASE_A = 0x61;
const LETTER_LOWERCASE_B = 0x62;
const LETTER_LOWERCASE_C = 0x63;
const LETTER_LOWERCASE_D = 0x64;
const LETTER_LOWERCASE_E = 0x65;
const LETTER_LOWERCASE_F = 0x66;
const LETTER_LOWERCASE_G = 0x67;
const LETTER_LOWERCASE_H = 0x68;
const LETTER_LOWERCASE_I = 0x69;
const LETTER_LOWERCASE_J = 0x6a;
const LETTER_LOWERCASE_K = 0x6b;
const LETTER_LOWERCASE_L = 0x6c;
const LETTER_LOWERCASE_M = 0x6d;
const LETTER_LOWERCASE_N = 0x6e;
const LETTER_LOWERCASE_O = 0x6f;
const LETTER_LOWERCASE_P = 0x70;
const LETTER_LOWERCASE_Q = 0x71;
const LETTER_LOWERCASE_R = 0x72;
const LETTER_LOWERCASE_S = 0x73;
const LETTER_LOWERCASE_T = 0x74;
const LETTER_LOWERCASE_U = 0x75;
const LETTER_LOWERCASE_V = 0x76;
const LETTER_LOWERCASE_W = 0x77;
const LETTER_LOWERCASE_X = 0x78;
const LETTER_LOWERCASE_Y = 0x79;
const LETTER_LOWERCASE_Z = 0x7a;

const stringified = JSON.stringify(data);
const buffered = Buffer.from(stringified, "utf8");

type BooleanResult = {
  data: boolean;
};

function parseBoolean(
  buffer: Buffer,
  index: number,
  result: BooleanResult
): number {
  switch (buffer[index++]) {
    case LETTER_LOWERCASE_T:
      if (buffer[index++] !== LETTER_LOWERCASE_R) return -1;
      if (buffer[index++] !== LETTER_LOWERCASE_U) return -1;
      if (buffer[index++] !== LETTER_LOWERCASE_E) return -1;
      result.data = true;
      return index;
    case LETTER_LOWERCASE_F:
      if (buffer[index++] !== LETTER_LOWERCASE_A) return -1;
      if (buffer[index++] !== LETTER_LOWERCASE_L) return -1;
      if (buffer[index++] !== LETTER_LOWERCASE_S) return -1;
      if (buffer[index++] !== LETTER_LOWERCASE_E) return -1;
      result.data = false;
      return index;
  }
  return -1;
}

function parse(buffer: Buffer) {
  let index = 0;
  let a = false;
  let booleanResult = {
    data: false
  };
  if (buffer[index++] !== OPEN_CURLY_BRACE) return null;
  if (buffer[index++] !== DOUBLE_QUOTE) return null;
  if (buffer[index++] !== LETTER_LOWERCASE_A) return null;
  if (buffer[index++] !== DOUBLE_QUOTE) return null;
  if (buffer[index++] !== COLON) return null;
  index = parseBoolean(buffer, index, booleanResult);
  if (index === -1) return null;
  a = booleanResult.data;
  if (buffer[index++] !== CLOSE_CURLY_BRACE) return null;
  return { a };
}

describe("parsing", () => {
  it("should produce the same result", function() {
    assert.deepEqual(
      JSON.parse(stringified),
      JSON.parse(JSON.stringify(parse(buffered)))
    );
  });
  it("should be faster than JSON.parse", function(done) {
    this.timeout(60000);
    suite
      .add("JSON.parse from string", function() {
        JSON.parse(stringified);
      })
      .add("JSON.parse from buffer", function() {
        JSON.parse(buffered.toString("utf8"));
      })
      .add("Hand written", function() {
        parse(buffered);
      })
      // add listeners
      .on("cycle", function(event: Benchmark.Event) {
        console.log(String(event.target));
      })
      .on("complete", function(this: Benchmark.Suite) {
        console.log(
          "Fastest is " + this.filter("fastest").map((x: any) => x.name)
        );
        done();
      })
      // run async
      .run({ async: true });
  });
});
