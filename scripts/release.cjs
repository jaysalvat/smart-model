
const sh = require('./shared.cjs')

const root = __dirname + '/../'
const version = process.argv[2] || 'patch'
const branch = sh.read('git rev-parse --abbrev-ref HEAD')
const dirty = !!sh.read('git diff --stat')

if (![ 'patch', 'minor', 'major' ].includes(version)) {
  sh.exit('Invalid version ' + version)
}

if (branch !== 'master') {
  sh.exit('Branch must be master')
}

if (dirty) {
  sh.exit('Branch is dirty')
}

sh.info('Bump version')
sh.exec('npm version ' + version)

sh.info('Build bundles')
sh.exec('npm run build')

sh.info('Publish to NPM')
sh.exec('npm publish')

sh.info('Commit and push to Github')
sh.exec('git add .')
sh.exec('git commit -m "Build v' + sh.pkg(root).version + '"')
sh.exec('git push')
