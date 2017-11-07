const later = require('later')
const pify = require('pify')
const { URL } = require('url')
const Job = require('mongoose').model('Job')
const browser = require('./browser.js')
const config = require('./config.js')

const runningJobs = {}

exports = module.exports = {
  start(job) {
    if (job.paused || runningJobs[job._id]) {
      return
    }

    const schedule = later.parse.text(job.interval, !config.production)

    runningJobs[job._id] = later.setInterval(() => {
      browser
        .execute(job)
        .then(result => updateValue(job, result))
        .catch(error => updateValue(job, error))
    }, schedule)
  },

  startAll() {
    // TODO: handle errors
    exports.getAll().then(jobs => {
      for (const job of jobs) {
        console.log('Starting:', job._id, job.title)
        exports.start(job)
      }
    })
  },

  getAll() {
    return Job.find().exec()
  },

  findById(id, projection) {
    return Job.findById(id, projection).exec()
  },

  pause(job) {
    if (job.paused && !runningJobs[job._id]) {
      return
    }

    job.paused = true

    // TODO: handle errors
    return pify(job.save)
      .apply(job)
      .then(clearJob)
  },

  resume(job) {
    if (!job.paused) {
      return
    }

    job.paused = false

    // TODO: handle errors
    return pify(job.save)
      .apply(job)
      .then(exports.restart) // restart just in case
  },

  restart(job) {
    clearJob(job)
    exports.start(job)
  },

  remove(job) {
    return pify(job.remove)
      .apply(job)
      .then(clearJob)
  },

  create(body) {
    let url = body.url

    // Has to be HTTP
    if (!/^https?:\/\//.test(body.url)) {
      if (/^[a-z]+:\/\//i.test(body.url)) {
        return Promise.reject({ message: 'URL must be HTTP(S)', status: 400 })
      }

      url = `http://${body.url}`
    }

    try {
      // Throws error if invalid
      url = new URL(url).href
    } catch (e) {
      return Promise.reject({ message: 'URL invalid', status: 400 })
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

    return Job.create({
      title: body.title,
      url: url,
      query: {
        // Default mode is 'query'
        mode: body.mode === 'query' || body.mode === 'regex' ? body.mode : 'query',
        selector: body.selector
      },
      interval: interval
    }).then(job => {
      exports.start(job)
      return job
    })
  }
}

function clearJob(job) {
  if (runningJobs[job._id]) {
    runningJobs[job._id].clear()
    delete runningJobs[job._id]
  }
}

function updateValue(job, newValue) {
  const oldValue = job.values.slice(-1)[0] || {}

  if (oldValue.kind !== newValue.kind || oldValue.value !== newValue.value) {
    job.values.push(newValue)

    // TODO: handle errors
    pify(job.save)
      .apply(job)
      .then(job => {
        console.log('Change:', oldValue, newValue)
        // email.send(job, oldValue, newValue)
      })
  }
}
