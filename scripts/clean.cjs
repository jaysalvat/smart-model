const sh = require('./shared.cjs')

const root = __dirname + '/../'

sh.info('Clean build dir')
sh.rm('-rf', root + 'build')

