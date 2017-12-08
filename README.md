# jdaughter

This project provides type-safe decoding (parsing) of JSON data. Here's a quick sample using `fetch` API:

```typescript
import { Decoder as D } from 'jdaughter'

const decoder =
  D.object
    .field('origin', D.string)
    .field('headers',
      D.object
        .field('Host', D.string)
    )

fetch('https://httpbin.org/anything')
    .then(response => response.text())
    .then(decoder.decode)
    .then(data => {
      // Here the data has correct type of
      // {origin: string, headers: {Host: string}}
      console.log(data.headers)
    })
```

You can see more examples in the tests.

## Motivation

Most of the recommendations on StackOverflow and other community sources simply recommend casting a parsed JSON response from an API to whatever we *believe* it should be. This is very unsafe, as data coming from the API has the same danger level as one directly inputted by the user. Besides the purposely malicious data, remote API might change, or simply malfunction, resulting in incorrect data sent over the wire.

All of this things may result in security issues or simply incorrect behavior of your application that can be quite hard to discover as the data from the API may only be accessed deep inside the application.

`jdaughter` fixes that by providing runtime type assertions through an easy-to-use API, so it is extremely useful even outside of the TypeScript scenario. It also has zero dependencies and can be used in any ECMAScript 2015 compatible (or transpiled) environment. 

## Planned Features

* Objects as maps from string to some type
* Arbitrary data transformation

## Usage

### Importing

Currently `jdaughter` has a single named export `Decoder`, and can be imported as follows in Commonjs:

```js
const { Decoder } = require('jdaughter')
```

Or like this in ES2015 modules or TypeScript:

```js
import { Decoder } from 'jdaughter'
```

Most of the time it is convenient to have an aliased input to save some typing and make decoders more readable:

```js
import { Decoder as D } from 'jdaughter'
```

### What is a Decoder?

In the vocabulary of the library, a decoder is simply an object with the following methods and fields:

```typescript
interface IDecoder<DecodedType> {
  Type: DecodedType
  
  /** @throws TypeError in case decoding fails */
  decode (json: string): DecodedType
  
  /** @throws TypeError in case decoding fails */
  decodeParsed (value: any): DecodedType
}
```

`decode` methods expected a raw JSON *string* and then either returns a fully decoded value of the `DecodedType`, or throws a `TypeError`. This is preferable way to use `jdaughter` as it can allows for future performance optimizations.

`decodeParsed` is very much the same, except it takes in an already `JSON.parse`d value and then does a decoding pass over it. This method should only be used if you can not get raw JSON string out of the libraries you use.

The reason it makes sense to decode even already parsed object is that besides just checking the types, decoder also does data transformation, e.g. parsing out a date or mapping field names.

`Type` field is slightly interesting. If you try to access this field at runtime, it will just throw, which may seem rather strange and not very useful. This field is only used in TypeScript for being able to specify the return type of the decoder through `typeof` operator:

```typescript
import { Decoder as D } from 'jdaughter'

const decoder = D.array(D.number)
const result: typeof decoder.Type = decoder.decode('[1, 2, 3]')
// type of result is number[] as it should be
```   

### Primitive Decoders

To be able to decode an ensure the basic JSON types, there are pre-defined decoders defined as fields on the `Decoder` object:

```js
Decoder.null
Decoder.boolean
Decoder.number
Decoder.string
```

### `Date` Decoder

It is quite common for APIs to provide date inside a JSON response, however JSON does not provide one. `Decoder.date` expects a string JSON value formatted as ISO 8601.

```js
const date = Decoder.date.decode('"2017-12-03T18:25:43+02:00"')
```

### Array Decoder

Allows to decode arrays of another type, which can be primitive:

```js
const arrayOfNumbersDecoder = Decoder.array(Decoder.number)
const result = numberArrayDecoder.decode('[1, 2, 3]')
```

Or it can be complex type, including a nested arrays


```js
const arrayOfArraysOfNumbersDecoder = Decoder.array(
  Decoder.array(Decoder.number)
)
const result = Decoder.array(Decoder.number).decode('[[1], [2], [3]]')
```

### Object Decoder

Allows to decode objects with a pre-defined sets of fields, including nested objects or arrays:

```js
const decoder =
    Decoder.object
      .field('foo', Decoder.string)
      .field('bar',
        Decoder.object
          .field('nested_bar', Decoder.string)
      )
      .field('arr', Decoder.array(Decoder.number))
const result = decoder.decode(JSON.stringify({
  foo: 'foo',
  bar: {
    'nested_bar': 'bar'
  },
  arr: [1, 2, 3]
}))
```

It is also possible to specify a mapping function from the field name you want in the decoded object to the one in the raw JSON. For example it is quite common for a JSON apis to have snake_case fields, while it is preferred to have camelCase in JavaScript:

```js
import { snakeCase } from 'lodash'

const decoder =
    Decoder.object
      .field('fooBar', Decoder.string, snakeCase)
const result = decoder.decode('{"foo_bar": "foo"}')
```

## License

The MIT License (MIT)

Copyright (c) 2017 Dmitriy Kubyshkin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

