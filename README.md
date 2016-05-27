[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

# Postling

Remote procedure call system to communicate with iframes.


## About

> Explicit is better than implicit.


## Usage

`npm install --save postling`


```js
import Postling from 'postling'

const postling = new Postling()

if (Object.keys(postling.methods).length === 0) {
  postling.methods.forEach((method) => {
    postling.methods[method]().then((result) => {
      console.log(`[${method}] - `, result);
    }).catch(::console.error)
  })
}
```

## Features

- simple RPC interface for `postMessage` communication
- promise interface

## TODO

- perhaps keep a (global) queue for the initial invocation instead of fetching them (?)
- use proper a `Proxy` object as the support and browser adaption is growing
