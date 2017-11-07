const later = require('later')
const { URL } = require('url')
const Job = require('mongoose').model('Job')
const browser = require('./browser.js')
const config = require('./config.js')

const runningJobs = {}

// Start an interval for the specified job
exports.start = async function(job) {
  if (runningJobs[job._id]) {
    exports.stop(job)
  }

  const schedule = later.parse.text(job.interval, !config.production)

  runningJobs[job._id] = later.setInterval(() => {
    browser
      .execute(job)
      .then(result => updateValue(job, result))
      .catch(error => updateValue(job, error))
  }, schedule)
}

exports.getAll = function() {
  return Job.find().exec()
}

exports.findById = function(id, projection) {
  return Job.findById(id, projection).exec()
}

// Start all jobs currently in the DB
exports.startAll = function() {
  exports
    .getAll()
    .then(jobs => {
      for (const job of jobs) {
        console.log('Starting:', job._id, job.title)
        exports.start(job)
      }
    })
    .end(error => {
      console.error('jobs.startAll error:', error)
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
exports.find = Job.find.bind(Job)

// If a value changed add it to the DB
function updateValue(job, newValue) {
  const oldValue = job.values.slice(-1)[0] || {}

  if (oldValue.kind !== newValue.kind || oldValue.value !== newValue.value) {
    job.values.push(newValue)

    // TODO: handle errors
    job.save((err, job) => {
      console.log('Change:', oldValue, newValue)
      // email.send(job, oldValue, newValue)
    })
  }
}

// Create and insert a job into the DB
exports.create = async function(body) {
  let url = body.url

  try {
    // Has to be HTTP
    if (!/^https?:\/\//.test(body.url)) {
      url = `http://${body.url}`
    }

    // Throws error if invalid
    url = new URL(url).href
  } catch (e) {
    throw { message: 'URL invalid', status: 400 }
  }

  if (!url.match(/^https?:/)) {
    throw { message: 'URL must be HTTP', status: 400 }
  }

  const weekDays = 'sunday monday tuesday wednesday thrusday friday saturday'.split(' ')
  const days = body.days.filter(day => weekDays.indexOf(day) >= 0).join(',')
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
      interval += '1 hour'
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
        interval += '15 seconds'
      } else {
        interval += '1 hour'
      }
      break
  }

  if (days.length) {
    interval += ` on ${days}`
  }

  const job = await Job.create({
    title: body.title,
    url: url,
    query: {
      // Default mode is 'query'
      mode: body.mode === 'query' || body.mode === 'regex' ? body.mode : 'query',
      selector: body.selector
    },
    interval: interval
  })

  exports.start(job)
  return job
}
