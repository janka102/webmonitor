const later = require('later')
const phridge = require('phridge')
const crypto = require('crypto')
const db = new (require('tingodb')()).Db('./monitor', {})
const jobs = db.collection('jobs')
const email = require('./email')
const config = require('./config.js')
const runningJobs = {}

// Start an interval for the specified job
exports.start = function(job) {
  if (runningJobs[job._id]) {
    exports.stop(job)
  }

  runningJobs[job._id] = later.setInterval(createInterval(job), job.schedule)
}

// Start all jobs currently in the DB
exports.startAll = function() {
  jobs.find().each((err, job) => {
    if (err) {
      console.error('jobs.startAll error:', err)
      return
    }

    if (job) {
      exports.start(job)
    }
  })
}

// Stop the inteval of the specified job
exports.stop = function(job) {
  runningJobs[job._id].clear()

  delete runningJobs[job._id]
}

// Stop job and remove from DB
exports.remove = function(job) {
  exports.stop(job)

  return jobs.remove(
    {
      _id: job._id
    },
    true
  )
}

// Expose the find function
exports.find = jobs.find.bind(jobs)

// Wrap collection.findOne() in a promise
exports.findOne = function(criteria, projection) {
  var args = Array.prototype.slice.call(arguments)

  return new Promise(function(resolve, reject) {
    jobs.findOne.apply(
      jobs,
      args.concat([
        function(err, job) {
          if (err || !job) {
            reject(err || new Error('Job not found'))
            return
          }

          resolve(job)
        }
      ])
    )
  })
}

// Ifa  value changed add it to the DB
exports.pushValue = function(job, newValue) {
  exports
    .findOne(
      {
        _id: job._id
      },
      {
        values: 1
      }
    )
    .then(
      function(dbJob) {
        var oldValue = (dbJob.values.slice(-1)[0] || {}).value

        if (oldValue !== newValue) {
          jobs.update(
            {
              _id: dbJob._id
            },
            {
              $push: {
                values: {
                  time: new Date(),
                  value: newValue
                }
              }
            }
          )

          if (dbJob.values.length) {
            email.send(job, oldValue, newValue)
          }
        }
      },
      function(err) {
        console.error('pushValue() findOne error:', err)
      }
    )
}

// Create and insert a job into the DB
exports.create = function(body) {
  const referenceDays = 'sunday monday tuesday wednesday thrusday friday saturday'.split(' ')
  const days = Object.keys(body.days)
    .filter(day => referenceDays.indexOf(day) >= 0)
    .join(',')
  let interval = 'every '

  switch (body.interval) {
    case '1':
      interval += '5 minutes'
      break
    case '2':
      interval += '15 minutes'
      break
    case '3':
      interval += '30 minutes'
      break
    case '4':
      interval += 'hour'
      break
    case '5':
      interval += '3 hours'
      break
    case '6':
      interval += '6 hours'
      break
    case '7':
      interval += '12 hours'
      break
    default:
      if (body.interval === '0' && !config.production) {
        interval += 'minute'
      } else {
        interval += 'hour'
      }
      break
  }

  if (days.length) {
    interval += ` on ${days}`
  }

  return new Promise((resolve, reject) => {
    const job = {
      id: crypto.randomBytes(16).toString('hex'),
      title: body.title,
      url: body.url,
      query: {
        // Default mode is 'query'
        mode: body.mode === 'query' || body.mode === 'regex' ? body.mode : 'query',
        selector: body.selector
      },
      schedule: later.parse.text(interval),
      values: []
    }

    jobs.insert(job, (err, result) => {
      if (err) {
        console.error('jobs.create error:', err)
        reject(err)
        return
      }

      result = result[0]

      exports.start(result)
      resolve(result)
    })
  })
}

function getValueType(value) {
  var out = {
      type: ''
    },
    currencySymbol

  value = value.trim()

  if (!value.length) {
    out.type = 'string'
  } else if (!isNaN(Number(value))) {
    out.type = 'number'
  } else if ((currencySymbol = value.match(/^[$€£¥]|[$€£¥]$/))) {
    out.type = 'currency'

    if (value.indexOf(currencySymbol[0]) === 0) {
      currencySymbol = '^\\' + currencySymbol[0]
    } else {
      currencySymbol = '\\' + currencySymbol[0] + '$'
    }

    out.symbol = currencySymbol
  } else {
    try {
      JSON.parse(value)

      out.type = 'json'
    } catch (e) {
      out.type = 'string'
    }
  }

  return out
}

function createInterval(job) {
  return function() {
    phridge
      .spawn()
      .then(function(phantom) {
        return phantom.openPage(job.url)
      })
      .then(function(page) {
        return page.run(job.pageQuery, function(pageQuery) {
          // Here we're inside PhantomJS, so we can't reference variables in the scope

          // 'this' is an instance of PhantomJS' WebPage
          return this.evaluate(function(pageQuery) {
            // Here we're *deeper* inside PhantomJS, so we can't reference variables in the scope
            var search

            if (pageQuery.mode === 'query') {
              search = document.querySelector(pageQuery.selector).textContent
            } else if (pageQuery.mode === 'regex') {
              search = document.body.innerText.match(new RegExp(pageQuery.selector))
            }

            return search
          }, pageQuery)
        })
      })
      .finally(phridge.dispose)
      .done(
        function(newValue) {
          exports.pushValue(job, newValue)
        },
        function(err) {
          console.error('pantom error', err)
          // throw err;
        }
      )
  }
}
