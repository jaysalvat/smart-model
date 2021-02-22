const sh = require('./shared.cjs')

const root = __dirname + '/../'

sh.info('Clean build dir ' + root + 'build')
sh.rm(root + 'build')
