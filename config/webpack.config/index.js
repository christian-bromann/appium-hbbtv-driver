require('babel-register')
const webpackValidator = require('webpack-validator')

const ENV = process.env.NODE_ENV || 'development'
const CONFIG = require(`./${ENV}`)

module.exports = webpackValidator(CONFIG)
