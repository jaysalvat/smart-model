/* eslint-disable no-process-exit */

import shell from 'shelljs'

const root = __dirname + '/../'
const version = process.argv[2]
const branch = getResult('git rev-parse --abbrev-ref HEAD')
const dirty = !!getResult('git diff --stat')

if (branch !== 'master') {
  exit('Branch must be master')
}

if (dirty) {
  exit('Branch is dirty')
}

info('Bump version')
shell.exec('npm version ' + version)

info('Clean build dir')
shell.rm('-rf', root + 'build')

info('Build bundles')
shell.exec('npm run build')

info('Publish to NPM')
shell.exec('npm publish')

info('Commit and push to Github')
shell.exec('git add .')
shell.exec('git commit -m "Build v' + getVersion() + '"')
shell.exec('git push')

function getVersion() {
  import { version } from '../package.json'
  return root + version
}

function getResult(cmd) {
  return shell.exec(cmd, { silent: true }).stdout.trim()
}

function info(msg) {
  console.log(msg, '\n')
}

function exit(msg) {
  console.log('\x1b[31m', '\n', msg, '\n')
  process.exit(1)
}
