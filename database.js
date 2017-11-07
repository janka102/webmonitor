const tungus = require('tungus')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('./config.js')

// Tungus only supports mongoose 3.x
// mongoose 3.x uses mpromise and doesn't support mongoose.Promise = Promise
// and mpromise doesn't have .catch, so have to do this hack to get it to work
// see https://github.com/aheckmann/mpromise/pull/14#issuecomment-68448406
require('mpromise').prototype.catch = function (onReject) {
  return this.then(undefined, onReject);
};

module.exports = function(cb) {
  mongoose.connect(config.mongoose)
  const db = mongoose.connection

  // Register models
  mongoose.model(
    'Job',
    Schema({
      title: String,
      url: {
        type: String,
        match: [/^https?:/, 'URL is not HTTP(S) ({VALUE})']
      },
      query: {
        mode: {
          type: String,
          enum: ['query', 'regex']
        },
        selector: String
      },
      interval: String,
      paused: {
        type: Boolean,
        default: false
      },
      values: [
        {
          time: Date,
          value: String,
          kind: {
            type: String,
            enum: ['number', 'text', 'error']
          }
        }
      ]
    })
  )

  db.on('error', cb)
  db.once('open', () => {
    console.log('Successfully connected to database')
    cb(null)
  })
}
