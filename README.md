```
 ___  __  __    __    ____  ____  __  __  _____  ____  ____  __   
/ __)(  \/  )  /__\  (  _ \(_  _)(  \/  )(  _  )(  _ \( ___)(  )  
\__ \ )    (  /(__)\  )   /  )(   )    (  )(_)(  )(_) ))__)  )(__ 
(___/(_/\/\_)(__)(__)(_)\_) (__) (_/\/\_)(_____)(____/(____)(____)

```

[![npm version](https://badge.fury.io/js/%40jaysalvat%2Fsmart-model.svg)](https://badge.fury.io/js/%40jaysalvat%2Fsmart-model)
                                                                                                     
SmartModel
==========

SmartModel is a fun experiment over ES6 Javascript Proxy. 

It tends to bring useful tools and best practices to Javascript data objects.

- [x] Small footprint <2Kb gzipped
- [x] Value transformation
- [x] Value formatting
- [x] Value type validation
- [x] Value content validation
- [x] Default value
- [x] Readonly properties
- [x] Computed properties
- [x] Exceptions (or not) if invalid
- [x] Nested models
- [x] Hooks
- [x] Subscriptions

### Compatibility

Should works on modern browsers. 
[Check if tests pass](https://unpkg.com/@jaysalvat/smart-model@latest/test/index.html) on your browser.

SmartModel uses javascript proxy. 
It unfortunately makes it **incompatible with some reactive front frameworks** (VueJs).

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

```javascript
import readingTime from 'readingTime'

export default SmartModel.create('Post', {
  title: {
    required: true,
    type: String
  },
  body: {
    required: true,
    type: String,
    rule: {
      tooShort: (value) => value.length < 100,
      tooLong: (value) => value.length > 1000
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
        required: true,
        type: String,
        transform: (value) => value.toUpperCase()
      },
      fullname: (author) => author.firstname + ' ' + author.lastname
    }
  },
  // Computed properties
  bodyLength: (post) => post.body.length,
  readingTime: (post) => readingTime(post.body)
},
// Settings
{
  strict: true,
  exceptions: true,
  methods: {
    $onUpdate() {
      this.updatedAt = new Date()
    }
  }
})
```

```javascript
import Post from './models/Post.js'

const post = new Post({
  title: 'My new post',
  body: 'Very long post...',
  author: {
    firstname: 'James',
    lastname: 'Hetfield'
  }
})
```

Try a `console.log(post)`

```
Post {
  createdAt: 2020-01-31T09:50:00.000Z,
  updatedAt: 2020-01-31T09:50:00.000Z,
  title: 'My new post',
  body: 'Very long post...',
  author: Author {  
    firstname: 'James', 
    lastname: 'Hetfield' 
  }
}
```

Let's try to log some other magic properties

```javascript
console.log(post.author.fullname)
console.log(post.createdAt)
console.log(post.readingTime)
```

They return

```
James HETFIELD
01/31/2020, 9:50:00 AM
12 minutes
```

## Documentation

### Schema

Options for property:

| Option      | Type    | Description 
| :---------- | :------ | :--
| default     | any     | Default value if the property is undefined
| format      | fn      | Function to format the value when its read
| readonly    | bool    | Boolean to prevent a value to be overwritten
| required    | bool    | Boolean to prevent a value to be empty
| rule        | object  | Object which contains the validation rules
| transform   | fn      | Function to transform the value when its written
| type        | any     | Required type of a value

#### default

The default value if the property is undefined.

#### format

A function to format the value when its read.

```javascript
const Event = SmartModel.create('Event', {
  name: { 
    type: String 
  },
  date: {
    type Date,
    format: (value) => new Date(value).toLocaleString()
  }
})
```

**Use with caution**, it could cause unexpected effects when the model is cloned.

```javascript
const clonedObject = Object.assign({}, model)
```

The formatted value becomes the new value of the cloned object.
Consider using the `$get()` method instead. 

```javascript
const clonedObject = model.$get()
```

Or consider using a computed property. 

```javascript
const Event = SmartModel.create('Event', {
  name: { 
    type: String 
  },
  date: {
    type Date,
  },
  formattedDate: (value) => new Date(value).toLocaleString()
})
```

#### readonly

The value can't be overwritten after init.

#### required

The value is required. See `settings.empty` for the empty value check function.

#### rule

An object which contains the validation rules
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

An exception is throw with the rule code when the condition if true.

#### transform

Function to transform the value when its written.

```javascript
const Event = SmartModel.create('Event', {
  name: { 
    type: String 
  },
  date: {
    type Date,
    transform: (value) => new Date(value)
  }
})
```

#### type

The required type of a value.
Type can be `Array`, `Boolean`, `Date`,  `Function`, `Object`, `String` or a class.
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
      lastname: {
        type: String
      }
    }
  }
})
```

An existing model can be set as a type in order to nest this model.

```javascript
const Author = SmartModel.create('Author', {
  firstname: {
    type: String
  },
  lastname: {
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

An array of models can be attach to a property with this fancy syntax.

```javascript
const Article = SmartModel.create('Article', {
  body: { 
    type: String 
  },
  comments: {
    type: [ Comment ]
  }
})
```

The syntax above is a shortcut for:

```javascript
const Article = SmartModel.create('Article', {
  body: { 
    type: String 
  },
  comments: {
    type: Array,
    transform: (value) => Comment.$hydrate(value)
  }
})
```

Now `comments` always is an array of `Comment` models.

### Settings

| Option      | Type        | Default   | Description
| :---------- | :---------- | :-------- | :--
| empty       | fn          | fn        | Function to check if a value is empty if required
| exceptions  | bool/object | object    | Object of exceptions settings
| methods     | object      | object    | Object of custom methods
| strict      | bool        | false     | Boolean to set only properties defined in the schema

#### empty

The function to check if a value is empty or not.
Default function is the function below.

```javascript
(value) => value === '' || value === null || value === undefined
```

#### strict

If `strict`set to `true`, only properties defined in the schema will be set.

#### exceptions

Any type of thrown exceptions can be set individually.
By default the `exceptions` settings is an object these default values:

| Option    | Type | Default 
| :-------- | :--- | :------
| readonly  | bool | false
| required  | bool | true
| rule      | bool | true
| strict    | bool | false
| type      | bool | true

If `exceptions` is set to `true`, all types of exceptions will be thrown.
If `exceptions` is set to `false`, all types of exceptions will be thrown.

### methods 

Custom `methods` can be added to model. Those methods will be accessible in any instances of the model.

```javascript
const Article = SmartModel.create('Article', {
  body: {
    type: String
  }
}, {
  methods: {
    excerpt(limit = 10) {
      return this.body.substr(0, limit) + '…'
    }
  }
})
```

### Methods 

#### $get

Returns standard JSON from the model content.

```javascript
const article = new Article()

const json = article.$get()
```

#### $post / $put

Replaces the model properties. 
Existing properties are deleted.
An exception is thrown if the properties are required.

```javascript
const article = new Article()

article.$put({
  title: 'My article'
})
```

#### $patch

Same as $post / $put, but only passed properties are updated.

#### $delete

Delete a or muliple properties of the model. 
An exception is thrown if the properties are required.

```javascript
const article = new Article()

article.$delete([ 'title', 'body' ])
```

#### $subscribe

Adds an update listener. It will be called any time a value is updated.

```javascript
article.$subscribe((property, value) => {
  console.log(property, 'has been updated with', value)
})
```

To unsubscribe the change listener, invoke the function returned by subscribe.

```javascript
const unsubscribe = article.$subscribe((property, value) => {
  console.log(property, 'has been updated with', value)
})

unsubscribe()
```

## Static methods

#### $check

Returns an array of potential errors if a payload was passed to the model.

```javascript
const errors = Article.$check(payload)
```

#### $hydrate

Turns an object or an array of objects into models.
Useful with API responses.

```javascript
fetch('https://api.com/post')
  .then(response => response.json())
  .then(response => Post.$hydrate(response))
  .then(response) => { /* Array of hydrated Post models */ }
```

```javascript
fetch('https://api.com/post/1234')
  .then(response => response.json())
  .then(response => Post.$hydrate(response))
  .then(response) => { /* Hydrated Post model */ }
```

## Hooks

Hooks are triggered before and after properties are set, get, updated or deleted.

```javascript
const User = SmartModel.create('User', {
  username: {
    type: String
  }
}, {
  methods: {
    $onBeforeDelete() {}
    $onBeforeGet() {}
    $onBeforeSet() {}
    $onBeforeUpdate() {}
    $onDelete() {}
    $onGet() {}
    $onSet() {}
    $onUpdate() {}
  }
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
