import shell from 'shelljs'

const root = __dirname + '/../'

shell.echo('Clean build dir')
shell.rm('-rf', root + 'build')

