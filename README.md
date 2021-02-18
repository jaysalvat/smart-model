[![npm version](https://badge.fury.io/js/%40jaysalvat%2Fsmart-model.svg)](https://badge.fury.io/js/%40jaysalvat%2Fmodel)

Model
=============

Javascript object model.

- [x] 1Kb gzipped
- [x] Value transformation
- [x] Value format
- [x] Value type validation
- [x] Value content validation (required, custom rules)
- [x] Default value
- [x] Virtual property
- [x] Live cycle events
- [ ] Proper documentation ^^
- [ ] decent tests ^^

## Install

Install npm package

```sh
npm install @jaysalvat/smart-model
```

### Module

```javascript
import SmartModel from '@jaysalvat/smart-model'
```

### CDN

```html
<script src="https://unpkg.com/@jaysalvat/model@latest/build/smart-model.umd.min.js"></script>
```

## Usage

Better documentation soon...

```javascript
const Post = SmartModel.create('Post', {
  title: {
    required: true,
    type: String,
  },
  body: {
    required: true,
    type: String,
  },
  date: {
    type: Date,
    default: new Date(),
    transform: (value) => new Date(value),
    format: (value) => new Date().toLocaleString()
  }
})

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

Bump version and publish to NPM

```sh
npm run release
npm run release:patch
npm run release:minor
npm run release:major
```
