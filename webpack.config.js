/*global GLOBAL: false */
var path = require('path')
var webpack = require('webpack')

module.exports = {
    output: {
        path: path.join(__dirname, 'build'),
        publicPath: '/',
        filename: '[name].js'
    },
    entry: {
        'lib/driver/driver': './lib/driver/driver.bundle.js'
    },
    resolve: {
        extensions: ['', '.js', '.es6'],
        modulesDirectories: ['node_modules'],
        alias: {
            driver: path.resolve(__dirname, 'lib/driver')
        }
    },
    cache: true,
    stats: {
        colors: true,
        reasons: true
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel'
        }]
    },
    // resolve bower components based on the 'main' property
    plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 10
        }),
        new webpack.optimize.MinChunkSizePlugin({
            minChunkSize: 20000
        })
    ]
}
