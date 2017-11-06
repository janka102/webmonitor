const later = require('later')
const puppeteer = require('puppeteer')
const { URL } = require('url')

const Job = require('mongoose').model('Job')
const config = require('./config.js')

const runningJobs = {}
let browser = null

// Start an interval for the specified job
exports.start = async function(job) {
  if (runningJobs[job._id]) {
    exports.stop(job)
  }

  if (!browser) {
    browser = await puppeteer.launch()
  }

  const schedule = later.parse.text(job.interval, !config.production)

  runningJobs[job._id] = later.setInterval(createInterval(job), schedule)
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

// Ifa  value changed add it to the DB
exports.pushValue = async function(job, newValue) {
  const dbJob = await Job.findById(job._id, { values: 1 }).exec()
  const oldValue = (dbJob.values.slice(-1)[0] || {}).value

  if (oldValue !== newValue.value) {
    dbJob.values.push(newValue)
    await dbJob.save()

    // email.send(job, oldValue, newValue)
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

function createInterval(job) {
  const run = async () => {
    const page = await browser.newPage()
    let result = null
    let error = null

    try {
      await page.goto(job.url, { timeout: 15 * 1000, waitUnilt: 'networkidle' })

      result = await page.evaluate(query => {
        let search

        if (query.mode === 'query') {
          const el = document.querySelector(query.selector)
          search = el ? el.textContent.trim() : ''
        } else if (query.mode === 'regex') {
          const match = document.body.textContent.match(new RegExp(query.selector))
          search = match ? match[0].trim() : ''
        }

        const number = Number(search)

        if (search.length && !isNaN(number)) {
          search = number
        }

        return search
      }, job.query)
    } catch (e) {
      error = e
    }

    await page.close()

    if (error) {
      throw error
    }

    return {
      time: new Date(),
      value: result,
      kind: typeof result === 'string' ? 'text' : 'number'
    }
  }

  return function() {
    run()
      .then(result => {
        console.log('result:', result)
        exports.pushValue(job, result)
      })
      .catch(error => {
        console.log('puppeteer error:', error)
        exports.pushValue(job, {
          time: new Date(),
          value: error.message,
          kind: 'error'
        })
      })
  }
}

process.on('SIGINT', () => {
  if (browser) {
    browser.close()
    browser = null
  }

  process.exit()
})

process.on('beforeExit', () => {
  if (browser) {
    browser.close()
    browser = null
  }
})

process.on('exit', () => {
  if (browser) {
    browser.close()
    browser = null
  }
})
