const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin')
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')
const webpack = require('webpack')

const wasm_package_name = 'viewer_crypto'

module.exports = {
  entry: './src/client/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'index_bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      wasm_package_name: JSON.stringify(wasm_package_name),
      svf_path: JSON.stringify(process.env.svf_path)

    }),
    new ServiceWorkerWebpackPlugin({
      entry: path.join(__dirname, 'src/client/sw.js')
    }),
    new CopyPlugin([
      {
        from: 'src/public/',
        to: ''
      },
      {
        from: `src/wasm/pkg/${wasm_package_name}_bg.wasm`,
        to: './'
      },
      {
        from: `src/wasm/pkg/${wasm_package_name}.js`,
        to: './',
        transform (content, path) {
          return content.toString().replace(`import * as wasm from './${wasm_package_name}_bg.wasm';`, '').replace(/export function/g, 'function')
        } }
    ]),
    new HtmlWebpackPlugin({
      title: ''
    }),
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, 'src/wasm'),
      extraArgs: '--no-typescript',
      outName: wasm_package_name
    })
  ]
}
