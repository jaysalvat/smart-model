```
 ________  _____ ______   ________  ________  _________  _____ ______   ________  ________  _______   ___          
|\   ____\|\   _ \  _   \|\   __  \|\   __  \|\___   ___\\   _ \  _   \|\   __  \|\   ___ \|\  ___ \ |\  \         
\ \  \___|\ \  \\\__\ \  \ \  \|\  \ \  \|\  \|___ \  \_\ \  \\\__\ \  \ \  \|\  \ \  \_|\ \ \   __/|\ \  \        
 \ \_____  \ \  \\|__| \  \ \   __  \ \   _  _\   \ \  \ \ \  \\|__| \  \ \  \\\  \ \  \ \\ \ \  \_|/_\ \  \       
  \|____|\  \ \  \    \ \  \ \  \ \  \ \  \\  \|   \ \  \ \ \  \    \ \  \ \  \\\  \ \  \_\\ \ \  \_|\ \ \  \____  
    ____\_\  \ \__\    \ \__\ \__\ \__\ \__\\ _\    \ \__\ \ \__\    \ \__\ \_______\ \_______\ \_______\ \_______\
   |\_________\|__|     \|__|\|__|\|__|\|__|\|__|    \|__|  \|__|     \|__|\|_______|\|_______|\|_______|\|_______|
   \|_________|                                                                                                    
```

[![npm version](https://badge.fury.io/js/%40jaysalvat%2Fsmart-model.svg)](https://badge.fury.io/js/%40jaysalvat%2Fsmart-model)
                                                                                                     
SmartModel
==========

Javascript object model.

- [x] 1Kb+ gzipped
- [x] Value transformation
- [x] Value format
- [x] Value type validation
- [x] Value content validation (required, custom rules)
- [x] Default value
- [x] Readonly properties
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
  title: 'My new post',
  body: 'Lorem ipsum...',
  author: {
    firstname: 'Brad',
    lastname: 'Pitt'
  }
})
```

## Documentation

### Schema

Options for property:

| Option      | Type    | Description 
| ----------- | ------- | ---
| type        | any     | The required type (*) of a value. You can set a schema or another model (*) in order to nest models 
| required    | bool    | The value is required. See `settings.empty` for the empty check function
| readonly    | bool    | The value can't be overwritten
| default     | any     | The default value if the property is undefined
| transform   | fn      | A function to transform the value to set
| format      | fn      | A function to format the value to get
| rule        | object  | An object which contains the validation rules (**)

#### [*] Type

Type can be `String`, `Boolean`, `Number`,  `Date`, `Function` or a class.
If a schema is set as a type, a nested model will be created.

```javascript
const Post = SmartModel.create('Post', {
  title: { 
    type: String 
  },
  body: { 
    type: String 
  },
  Date: { 
    type: Date 
  },
  author: {
    type {
      firstname: {
        type: String
      },
      lastnaame: {
        type: String
      }
    }
  }
})
```

An existing Model can be set as a type in order to nest this Model.

```javascript
const Author = SmartModel.create('Author', {
  firstname: {
    type: String
  },
  lastnaame: {
    type: String
  }
})

const Post = SmartModel.create('Post', {
  title: { 
    type: String 
  },
  body: { 
    type: String 
  },
  Date: { 
    type: Date 
  },
  body: { 
    type: string 
  },
  author: {
    type: Author
  }
})
```

#### [**]s Rule

Multiple rules of validation can be set on a property.

```javascript
const Discount = SmartModel.create('Discount', {
  percent: {
    type: Number,
    rule: {
      'min': {value) => value < 0,
      'max': {value) => value > 100
    }
  }
})
```

### Settings

| Option      | Type        | Default       | Description
| ----------- | ----------- | ------------- | ---
| strict      | bool        | false         | Allow to set property not present in the schema
| empty       | fn          | fn (***)      | Function to check if a value is empty if required
| exceptions  | bool/object | object (****) | Throw exceptions on errors. can be `boolean` or òbject` for advanced settings

#### [***] Empty check function 

The default function to check if a value is empty is:

```javascript
(value) => value === '' || value === null || value === undefined
```

#### [****] Exceptions object

| Option    | Type | Default 
| --------- | ---- | -------
| readonly  | bool | false
| required  | bool | true
| rule      | bool | true
| strict    | bool | false
| type      | bool | true

### Methods 

#### $put

```javascript
const article = new Article()

article.put({
  title: 'My article',

})
```

#### $patch

Same as $put, but only passed property are updated.

#### $eject

```javascript
const article = new Article()

const json = article.eject()
```

### Custom methods 

Methods can be added to models.

```javascript
const Article = SmartModel.create('Article', {
  body: {
    type: String
  }
}, {}, {
  excerpt(limit = 10) {
    return this.body.substr(0, limit) + '…'
  }
})
```

## Callbacks

Models have some callbacks methods that are called when properties are set, get, updated or deleted.

```javascript
const User = SmartModel.create('User', {
  username: {
    type: String
  }
}, {}, {
  $onBeforeGet() {}
  $onBeforeSet() {}
  $onBeforeUpdate() {}
  $onDelete() {}
  $onGet() {}
  $onBeforeDelete() {}
  $onSet() {}
  $onUpdate() {}
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
