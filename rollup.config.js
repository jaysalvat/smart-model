import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const NAME = 'SmartModel'
const FILENAME = 'smart-model'
const SRC = './src'
const DIST = './build'
const DATE = new Date().toISOString().replace(/[TZ]/g, ' ').split('.')[0]

const configs = []
const formats = [ 'esm', 'esm.min', 'umd', 'umd.min' ]
const mutedWarnings = [ 'CIRCULAR_DEPENDENCY' ]
const watched = process.env.ROLLUP_WATCH

const bannerLight = `/*! ${NAME} v${pkg.version} */`
const bannerFull = `
/**!
* ${NAME}
* ${pkg.description}
* https://github.com/jaysalvat/${FILENAME}
* @version ${pkg.version} built ${DATE}
* @license ${pkg.license}
* @author Jay Salvat http://jaysalvat.com
*/`

formats.forEach((type) => {
  const [ format, minify ] = type.split('.')
  const filename = FILENAME + '.' + format + (minify ? '.min' : '') + '.js'

  configs.push({
    input: SRC + '/index.js',
    output: {
      exports: 'named',
      format: format,
      file: DIST + '/' + filename,
      name: format === 'umd' ? NAME : null,
      banner: !watched && (minify ? bannerLight : bannerFull),
      plugins: [
        !watched && minify ? terser() : null
      ]
    },
    onwarn: (warning, warn) => {
      if (mutedWarnings.includes(warning.code)) {
        return
      }
      warn(warning)
    }
  })
})

export default configs
