const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs').default;
const typescript = require('rollup-plugin-typescript2');
const { terser } = require('rollup-plugin-terser');
const json = require('@rollup/plugin-json');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      banner: '\'use client\';'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
      banner: '\'use client\';'
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      clean: true
    }),
    terser(),
  ],
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    '@tanstack/react-query',
    'axios'
  ],
};
