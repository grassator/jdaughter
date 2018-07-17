import * as Benchmark from "benchmark";
import { strict as assert } from "assert";
import * as D from "./index";

const suite = new Benchmark.Suite();

const data = [];

for (let i = 0; i < 100; ++i) {
  data.push(String(Math.random()));
}

const stringified = JSON.stringify(data);
const buffered = Buffer.from(stringified, "utf8");

const descriptor = D.array(D.string);
const bufferDecoder = D.compileBufferDecoder(descriptor);
const parse = (buffer: Buffer) => {
  return D.runBufferDecoder(bufferDecoder, buffer);
};

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
