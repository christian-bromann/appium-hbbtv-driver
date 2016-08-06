var webpackConfig = require('./webpack.config.js')
var webpack = require('webpack')

module.exports = function (grunt) {
    grunt.initConfig({
        pkgFile: 'package.json',
        clean: ['build'],
        babel: {
            dist: {
                files: [{
                    expand: true,
                    cwd: './',
                    src: ['index.js', './lib/**/*.js', '!lib/driver/**/*.js'],
                    dest: 'build',
                    ext: '.js'
                }]
            }
        },
        eslint: {
            options: {
                parser: 'babel-eslint'
            },
            target: ['lib/reporter.js']
        },
        contributors: {
            options: {
                commitMessage: 'update contributors'
            }
        },
        bump: {
            options: {
                commitMessage: 'v%VERSION%',
                pushTo: 'upstream'
            }
        },
        watch: {
            dist: {
                files: [
                    'lib/**/*.js',
                    '!lib/driver/**/*.js' // handled by webpack
                ],
                tasks: ['babel:dist']
            }
        },
        webpack: {
            options: webpackConfig,
            prod: {
                devtool: 'source-map',
                plugins: webpackConfig.plugins.concat(
                    new webpack.optimize.UglifyJsPlugin({
                        compress: { warnings: false }
                    }),
                    new webpack.optimize.DedupePlugin()
                )
            },
            dev: {
                devtool: '#cheap-module-source-map',
                debug: true,
                watch: true,
                keepalive: true,
                failOnError: false
            }
        },
        concurrent: {
            dev: {
                tasks: ['webpack:dev', 'watch'],
                options: {
                    logConcurrentOutput: true,
                    limit: 2
                }
            }
        }
    })

    require('load-grunt-tasks')(grunt)
    grunt.registerTask('default', ['eslint', 'build', 'mocha_istanbul'])
    grunt.registerTask('build', 'Build wdio-allure-reporter', function () {
        grunt.task.run([
            'clean',
            'babel'
        ])
    })
    grunt.registerTask('release', 'Bump and tag version', function (type) {
        grunt.task.run([
            'build',
            'contributors',
            'bump:' + (type || 'patch')
        ])
    })

    grunt.registerTask('dev', ['concurrent:dev'])
}
