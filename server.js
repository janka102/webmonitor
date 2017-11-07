// Add items to `process.env`
require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const bodyParser = require('body-parser')
const nunjucks = require('nunjucks')
const path = require('path')
const util = require('util')
const config = require('./config.js')
const database = require('./database.js')

function startServer() {
  const jobs = require('./jobs.js')
  const app = express()

  // Setup the server
  if (!config.production) {
    app.use(morgan('dev'))
  } else {
    app.use(compression())
  }

  app.disable('x-powered-by')
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  )

  // Set "./views" as the views folder
  nunjucks.configure('views', {
    express: app,
    noCache: !config.production
  })

  // Set default template extension to .html
  app.set('view engine', 'html')

  app.locals.css = ['/css/main.css']
  app.locals.js = []
  app.locals.domain = config.domain

  // Public files
  app.use(express.static(path.join(config.root, 'public')))

  app.get('/', (req, res) => {
    res.render('index', {
      path: '/',
      production: config.production,
      css: req.app.locals.css.concat('/css/index.css'),
      js: req.app.locals.js.concat('/js/atomic.min.js', '/js/index.js')
    })
  })

  app.get('/list', (req, res) => {
    jobs.getAll().then(array => {
      res.render('list', {
        path: '/list',
        css: req.app.locals.css.concat('/css/list.css'),
        jobs: array
      })
    })
  })

  app.post('/monitor', (req, res) => {
    const job = {
      title: typeof req.body.title === 'string' ? req.body.title : '',
      url: typeof req.body.url === 'string' ? req.body.url : '',
      selector: typeof req.body.selector === 'string' ? req.body.selector : '',
      mode: typeof req.body.mode === 'string' ? req.body.mode : '',
      days: req.body.days && typeof req.body.days === 'object' ? Object.keys(req.body.keys) : [],
      interval: typeof req.body.interval === 'string' ? req.body.interval : ''
    }

    jobs
      .create(job)
      .then(job => {
        res.status(200)
        res.json({ data: job._id, status: 200 })
      })
      .catch(error => {
        res.status(error.status || 500)
        res.json(error)
      })
  })

  app.get('/manage/:id', (req, res) => {
    jobs.findById(req.params.id).then(
      job => {
        res.render('manage', {
          css: req.app.locals.css.concat('/css/manage.css'),
          js: req.app.locals.js.concat('/js/manage.js'),
          job: job
        })
      },
      err => {
        res.render('error', {
          title: 'Not found',
          error: {
            name: 'Could not find specified monitor value',
            description: `There is no current monitor value with id "<b>${req.params.id}</b>"`
          }
        })
      }
    )
  })

  // Catch-all/404
  app.use((req, res, next) => {
    res.status(404)
    res.render('error', {
      title: 'Not Found',
      error: {
        name: '404 - Page not found',
        description: 'The page at <b>' + req.path + '</b> was not found. Go <a href="' + config.domain + '">home</a>.'
      }
    })
  })

  // Open the port for business
  app.listen(config.port, () => {
    console.log(`=> Running on ${config.domain}`)
    jobs.startAll()
  })
}

database(error => {
  if (error) {
    console.error('Database error:', error)
    return
  }

  startServer()
})
