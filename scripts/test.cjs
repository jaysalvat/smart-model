const shell = require('shelljs')

const red = '\033[0;31m'
const nc = '\033[0m' 

function exec(cmd) {
  const std = shell.exec(cmd, { silent: true })

  text('log', std.stdout)
  text('error', std.stderr)
}

const t = exec('npm run build')

// Error:
// ERR!

function text(type, std) {
  let lines = std.split('\n')

  lines = lines.map((line) => {
    return line.match(/(Error:|ERR!|    at )/) ? red + line + nc : line
  })

  const joined = lines.join('\n')

  if (joined) {
    console[type](joined)
  }
}