const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require('./config.js');

Object.assign(exports, {
  init(cb) {
    mongoose.connect(
      config.mongoose,
      { useNewUrlParser: true }
    );
    const db = mongoose.connection;

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
        enabled: {
          type: Boolean,
          default: true
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
    );

    db.on('error', cb);
    db.once('open', () => {
      console.log('Successfully connected to database');
      cb(null);
    });
  }
});
