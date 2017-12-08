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

* Parsing of basic rigid structures and types (done)
* Mapping of field names (e.g. camelCase to snake_case)
* Objects as maps from string to some time
* Arbitrary data transformation

## License

The MIT License (MIT)

Copyright (c) 2017 Dmitriy Kubyshkin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

