[![npm version](https://badge.fury.io/js/%40jaysalvat%2Fsmart-model.svg)](https://badge.fury.io/js/%40jaysalvat%2Fsmart-model)

Model
=============

Javascript object model.

- [x] ~1Kb gzipped
- [x] Value transformation
- [x] Value format
- [x] Value type validation
- [x] Value content validation (required, custom rules)
- [x] Default value
- [x] Virtual property
- [x] Throw exception (or not) if invalid
- [x] Nested models
- [x] Live cycle events
- [ ] Proper documentation ^^

Works on modern browsers. 
[Check if tests pass](https://unpkg.com/@jaysalvat/smart-model@latest/test/index.html) on your browser.

## Install

[Provided formats](https://github.com/jaysalvat/smart-model/tree/master/build) are IFFE, ESM, CJS and UMD, all minified.

### NPM

```sh
npm install @jaysalvat/smart-model
```

```javascript
import SmartModel from '@jaysalvat/smart-model'
```

### Module from CDN

```javascript
import SmartModel from 'https://unpkg.com/@jaysalvat/smart-model@latest/build/smart-model.esm.min.js'
```

### The old way

```html
<script src="https://unpkg.com/@jaysalvat/smart-model@latest/build/smart-model.min.js"></script>
```

## Usage

Better documentation soon...

```javascript
function readingtime(text) { /*...*/ }

const Post = SmartModel.create('Post', {
    title: {
      required: true,
      type: String,
    },
    body: {
      required: true,
      type: String,
      rule: {
        'tooShort': (calue) => value.length < 100,
        'tooLong': (calue) => value.length > 1000,
      }
    },
    createdAt: {
      type: Date,
      default: new Date(),
      transform: (value) => new Date(value),
      format: (value) => value.toLocaleString()
    },
    updatedAt: {
      type: Date,
      default: new Date(),
      transform: (value) => new Date(value),
      format: (value) => value.toLocaleString()
    },
    // Nested model
    author: {
      required: true,
      type: {
        firstname: {
          required: true,
          type: String
        },
        lastname: {
          type: String
        }
      }
    },
    // Virtual properties
    bodyLength: (post) => post.body.length, 
    readingTime: (post) => readingTime(post.body)
  }, 
  // Settings
  {
    strict: false,
    exceptions: true
  }
  // Events
  {
    onUpdate() {
      this.updatedAt = new Date()
    }
  }
)
```

```javascript
const post = new Post({
  title: 'my new post',
  body: 'lorem ipsum...'
})
```

## Dev

Dev mode

```sh
npm run dev
```

Build

```sh
npm run build
```

Lint

```sh
npm run lint
```

Fix lint errors

```sh
npm run lint:fix
```

Tests

```sh
npm run test
```

```sh
npm run test:watch
```

```sh
npm run test:browser
```

Bump version and publish to NPM

```sh
npm run release
```

```sh
npm run release:patch
```

```sh
npm run release:minor
```

```sh
npm run release:major
```
