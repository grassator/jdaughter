# jdaughter

This project provides type-safe decoding (validation) of a JSON structure. Here's a quick sample using `fetch` API:

```typescript
import * as D from "jdaughter";

const decoder =
  D.object({
    origin: D.string,
    headers: D.object({ Host: D.string })
  });

fetch('https://httpbin.org/anything')
    .then(response => response.json())
    .then(data => D.decode(decoder, data))
    .then(data => {
      // Here the data has correct structure (and type in TypeScript)
      // {origin: string, headers: {Host: string}}
      console.log(data.headers);
    });
```

You can see more examples in the tests.

> NOTE: Currently this library only provides decoding (validation) of the exact structure of the target value, not the direct parsing from the JSON.

## Motivation

Most of the recommendations on StackOverflow and other community sources simply recommend assuming a parsed JSON response from an API is whatever we *believe* it should be. This is very unsafe, as data coming from the API has the same danger level as one directly inputted by the user. Besides the purposely malicious data, remote API might change or malfunction, resulting in incorrect data sent over the wire.

All of this things may result in security issues or incorrect behavior of your application that can be quite hard to discover as the data from the API may only be accessed deep inside the application.

`jdaughter` fixes the issue by providing runtime type assertions through an easy-to-use API. It has zero dependencies and can be used in any ECMAScript 2015 compatible (or transpiled) environment or in TypeScript projects. 

## TypeScript Support

> `jdaughter` requires TypeScript 2.8+ as it make use of conditional types.

A big feature of `jdaughter` is not only ensuring correct structure of the decoded value, but also the correct type. This means that if you ensure that every incoming value in the application is passing through a decoder you will have a much higher degree of certainty that the program won't explode at runtime. Technically if you are not using type corecions and avoid things that throw, you should be completely safe.

If you have a decoder and want to get the type of the decoded type, this can be done as follows:

```typescript
import { DecodedType, array, number } from "jdaughter";

const arrayDecoder = array(number);

type ArrayOfNumbers = DecodedType<typeof arrayDecoder>;
```

## Usage

### Importing

Currently `jdaughter` can be imported as follows in Commonjs:

```js
const Decoder = require("jdaughter")
```

Or like this in ES2015 modules or TypeScript:

```js
import * as Decoder from "jdaughter";
```

### Primitive Decoders

To be able to decode and ensure the basic JSON types, there are pre-defined decoders available inside the library:

```js
import { null_, boolean, number, string } from "jdaughter";
```

### `Date` Decoder

It is quite common for APIs to provide date inside a JSON response, however JSON does not provide one. `date` expects a string value formatted as ISO 8601.

```js
import { decode, date, decode } from "jdaughter";
const date = decode(date, "2017-12-03T18:25:43+02:00");
```

### Array Decoder

Allows to decode arrays of another type, which can be primitive:

```js
import { array, number, decode } from "jdaughter";
const arrayOfNumbersDecoder = array(number);
const result = decode(arrayOfNumbersDecoder, [1, 2, 3]);
```

Or it can be complex type, including a nested arrays

```js
import { array, number, decode } from "jdaughter";
const arrayOfArraysOfNumbersDecoder = array(array(number))
const result = arrayOfArraysOfNumbersDecoder.decode([[1], [2], [3]])
```

### Object Decoder

Allows to decode objects with a pre-defined sets of fields, including nested objects or arrays:

```js
import { object, array, string, decode } from "jdaughter";
const decoder =
    object({
      foo: string,
      bar: object({
        nested_bar: string
      }),
      arr: array(string)
    })
const result = decode(decoder, {
  foo: 'foo',
  bar: {
    'nested_bar': 'bar'
  },
  arr: [1, 2, 3]
})
```

It is also possible to specify a mapping function from the field name you want in the decoded object to the one in the raw JSON. For example it is quite common for a JSON apis to have snake_case fields, while it is preferred to have camelCase in JavaScript:

```js
import { object, string, decode } from "jdaughter";
import { snakeCase } from 'lodash'

const decoder = object({ fooBar: string }, snakeCase)
const result = decode(decoder, {"foo_bar": "foo"})
```

### Dictionary Decoder

Some APIs use JSON objects as dictionaries either from strings to some values, for example strings to booleans:

```js
import { dictionary, string, boolean, decode } from "jdaughter";
const decoder = dictionary(string, boolean)
const result = decode(decoder, {
  foo: false,
  bar: true
})
```

> When used in TypeScript this will produce correct indexed type `{[key: string]: boolean}`

## License

The MIT License (MIT)

Copyright (c) 2017 Dmitriy Kubyshkin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

