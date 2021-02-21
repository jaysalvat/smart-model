module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parserOptions: {
    sourceType: 'module'
  },
  extends: [
    '@jaysalvat/eslint-config'
  ],
  rules: {
    'newline-before-return': 2,
    'no-empty': [ 2, { allowEmptyCatch: true } ]
  }
}
