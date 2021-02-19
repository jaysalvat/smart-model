/* eslint-disable no-process-exit */

const shell = require('shelljs')
const red = '\033[0;31m'
const cyan = '\033[0;36m'
const nc = '\033[0m' 

exports.pkg = function (root) {
  return require(root + 'package.json')
}

exports.read = function (cmd) {
  return shell.exec(cmd, { silent: true }).stdout.trim()
}

exports.info = function (msg) {
  console.log(cyan, msg, nc)
}

exports.exit = function (msg) {
  console.log(red, msg, nc)
  process.exit(1)
}

exports.rm = function (path) {
  shell.rm('-rf', path)
}

exports.exec = function (cmd) {
  const std = shell.exec(cmd, { silent: true })

  if (std.stderr) {
    console.error(red, std.stderr, nc);
  } else {
    console.log(std.stdout);
  }
}