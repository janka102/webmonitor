const puppeteer = require('puppeteer')

let browser = null
const backlog = []

exports = module.exports = {
  execute(job) {
    if (!browser) {
      return new Promise((resolve, reject) => {
        const fn = (error, result) => {
          if (error) {
            return reject(error)
          }

          resolve(result)
        }

        backlog.push({ job, fn })
      })
    }

    return execute(job)
  }
}

puppeteer.launch().then(newBrowser => {
  browser = newBrowser

  for (const { job, fn } of backlog) {
    exports
      .execute(job)
      .then(result => fn(null, result))
      .catch(error => fn(error))
  }

  backlog.length = 0
})

async function execute(job) {
  const page = await browser.newPage()
  let numRequests = 0
  let result = null
  let error = null

  await page.setRequestInterceptionEnabled(true)

  page.on('request', request => {
    const { url, resourceType } = request

    // Abort data URIs and images
    if (/^data:/i.test(url) || resourceType === 'image' || numRequests > 100) {
      request.abort()
      return
    }

    numRequests++
    request.continue()
  })

  try {
    await page.goto(job.url, { timeout: 15 * 1000, waitUnilt: 'networkidle' })

    result = await page.evaluate(query => {
      let search = ''

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
    throw {
      time: new Date(),
      value: error.message,
      kind: 'error'
    }
  }

  return {
    time: new Date(),
    value: result,
    kind: typeof result === 'string' ? 'text' : 'number'
  }
}
