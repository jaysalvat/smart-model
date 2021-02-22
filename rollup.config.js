/* eslint-disable camelcase */
import { terser } from 'rollup-plugin-terser'
import filesize from 'rollup-plugin-filesize'
import pkg from './package.json'

const NAME = 'SmartModel'
const FILENAME = 'smart-model'
const SRC = './src'
const DIST = './build'
const DATE = new Date().toISOString().replace(/[TZ]/g, ' ').split('.')[0]

const configs = []
const formats = [
  'iife', 'iife.min',
  'esm', 'esm.min',
  'cjs', 'cjs.min',
  'umd', 'umd.min'
]
const mutedWarnings = [ 'CIRCULAR_DEPENDENCY' ]
const watched = process.env.ROLLUP_WATCH

const bannerMinify = `/*! ${NAME} v${pkg.version} */`
const bannerBeautify = `
/**!
* ${NAME}
* ${pkg.description}
* https://github.com/jaysalvat/${FILENAME}
* @version ${pkg.version} built ${DATE}
* @license ${pkg.license}
* @author Jay Salvat http://jaysalvat.com
*/`

const terserBeautify = {
  mangle: false,
  compress: false,
  output: {
    beautify: true,
    indent_level: 2,
    braces: true
  }
}

const terserMinify = {
  mangle: {
    toplevel: false
  },
  compress: {
    toplevel: false,
    reduce_funcs: true,
    keep_infinity: true,
    pure_getters: true,
    passes: 10
  }
}

formats.forEach((type) => {
  const [ format, minify ] = type.split('.')
  const extension = format === 'cjs' ? '.cjs' : '.js'
  const postfix = format === 'iife' ? '' : '.' + format
  const postfixMin = minify ? '.min' : ''
  const filename = FILENAME + postfix + postfixMin + extension

  configs.push({
    input: SRC + '/index.js',
    output: {
      format: format,
      file: DIST + '/' + filename,
      name: NAME,
      exports: 'default',
      banner: !watched && (minify ? bannerMinify : bannerBeautify),
      plugins: [
        !watched && terser(minify ? terserMinify : terserBeautify),
        filesize({
          showMinifiedSize: false
        })
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
