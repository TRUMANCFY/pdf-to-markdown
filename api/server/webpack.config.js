
var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals')

var SOURCE_DIR = path.resolve(__dirname, 'src');
var JAVASCRIPT_DIR = path.resolve(__dirname, 'src/javascript');
var MODEL_DIR = path.resolve(__dirname, 'src/models')
var BUILD_DIR = path.resolve(__dirname, 'build');
var NODEMODULES_DIR = path.resolve(__dirname, 'node_modules');
// var EXTRA_DIR = path.resolve(__dirname, '/src/javascript/')

console.log(JAVASCRIPT_DIR)

module.exports = {
    context: SOURCE_DIR,
    target: 'node',
    resolve: {
        modules: [
            path.resolve(JAVASCRIPT_DIR),
            path.resolve(SOURCE_DIR),
            path.resolve('node_modules')
        ]
    },
    entry: {
        app: ['babel-polyfill', './index.js']
    },
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                // Ask webpack to check: If this file ends with .js, then apply some transforms
                test: /\.jsx?$/,
                loader: 'babel-loader',
                include: [JAVASCRIPT_DIR, SOURCE_DIR, MODEL_DIR],
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            },
            {
                test: /\.png$/,
                loader: "url-loader?limit=100000"
            },
            {
                test: /\.jpg$/,
                loader: "file-loader"
            },
            {
                test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=application/font-woff'
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=application/octet-stream'
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader'
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url-loader?limit=10000&mimetype=image/svg+xml'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'version': JSON.stringify(process.env.npm_package_version),
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
            }
        }),
        new CopyWebpackPlugin([
            {
                from: NODEMODULES_DIR + '/pdfjs-dist/build/pdf.worker.js',
                to: 'bundle.worker.js'
            },
        ]),
        new CopyWebpackPlugin([
            {
                from: NODEMODULES_DIR + '/pdfjs-dist/cmaps',
                to: 'cmaps'
            },
        ])
        // new CopyWebpackPlugin([
        //     {
        //         from: 'favicons',
        //         to: 'favicons'
        //     },
        // ])
    ],
    externals: [
        nodeExternals()
    ]
}