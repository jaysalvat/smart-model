const shell = require('shelljs')

function exec(cmd) {
  const red = '\033[0;31m'
  const nc = '\033[0m' 
  const std = shell.exec(cmd, { silent: true })

  if (std.stderr) {
    console.error(red + std.stderr + nc);
  } else {
    console.log(std.stdout);
  }
}