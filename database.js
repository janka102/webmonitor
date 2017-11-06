const tungus = require('tungus')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const config = require('./config.js')

mongoose.Promise = Promise

module.exports = function(cb) {
  mongoose.connect(config.mongoose)
  const db = mongoose.connection

  // Register models
  const jobSchema = Schema({
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
    values: [{
      time: Date,
      value: String,
      kind: {
        type: String,
        enum: ['number', 'text', 'error']
      }
    }]
  })

  mongoose.model('Job', jobSchema)

  db.on('error', cb)
  db.once('open', () => {
    console.log('Successfully connected to database')
    cb(null)
  })
}
