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
const jobs = require('./jobs')
const app = express()

// Setup the server
if (!config.production) {
  app.use(morgan('dev'))
}

app.disable('x-powered-by')
app.use(compression())
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)

// Set "./views" as the views folder
nunjucks.configure('views', {
  express: app,
  noCache: !config.production
})

// Set default template extension to .html
app.set('view engine', 'html')

app.locals.css = ['/main.css']
app.locals.js = []
app.locals.domain = config.domain

// Public files
app.use(express.static(path.join(config.root, 'public')))

app.get('/', function(req, res) {
  res.render('index', {
    production: config.production,
    css: req.app.locals.css.concat('/index.css')
  })
})

app.get('/list', function(req, res) {
  jobs
    .find(
      {},
      {
        _id: 0,
        id: 1,
        title: 1,
        url: 1
      }
    )
    .toArray(function(err, array) {
      if (err) {
        console.error('Find error:', err)
        res.render('error', {
          error: {
            title: 'Internal error',
            name: 'Could not create monitored value'
          }
        })
        return
      }

      res.render('list', {
        jobs: array
      })
    })
})

app.post('/monitor', function(req, res) {
  jobs.create(req.body).then(
    function(job) {
      res.send(200)
    },
    function(err) {
      res.send(500)
    }
  )
})

app
  .route('/stop/:id')
  .get(function(req, res) {
    jobs
      .findOne({
        id: req.params.id
      })
      .then(
        function(job) {
          res.render('stop', {
            job: job
          })
        },
        function(err) {
          res.render('error', {
            error: {
              title: 'Not found',
              name: 'Could not find specified monitor value',
              description: 'There is no current monitor value with id "<b>' + req.params.id + '</b>"'
            }
          })
        }
      )
  })
  .post(function(req, res) {
    jobs
      .findOne({
        id: req.params.id
      })
      .then(
        function(job) {
          jobs.remove(job)

          res.send(200)
        },
        function(err) {
          res.status(404).end(
            JSON.stringify({
              error: err
            })
          )
        }
      )
  })

// Catch-all/404
app.use((req, res, next) => {
  res.status(404)
  res.render('error', {
    error: {
      title: 'Not Found',
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
