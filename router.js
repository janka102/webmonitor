const express = require('express');
const jobs = require('./jobs.js');
const feed = require('./feed.js');
const config = require('./config.js');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    path: '/',
    production: config.production,
    css: req.app.locals.css.concat('/css/form.css'),
    js: req.app.locals.js.concat('/js/atomic.min.js', '/js/form.js')
  });
});

router.get('/list', (req, res) => {
  jobs.getAll().then((array) => {
    res.render('list', {
      path: '/list',
      css: req.app.locals.css.concat('/css/list.css'),
      jobs: array
    });
  });
});

router.post('/monitor', (req, res) => {
  const job = {
    title: typeof req.body.title === 'string' ? req.body.title : '',
    url: typeof req.body.url === 'string' ? req.body.url : '',
    selector: typeof req.body.selector === 'string' ? req.body.selector : '',
    mode: typeof req.body.mode === 'string' ? req.body.mode : '',
    days:
      req.body.days && typeof req.body.days === 'object'
        ? Object.keys(req.body.days)
        : [],
    interval: typeof req.body.interval === 'string' ? req.body.interval : ''
  };

  jobs
    .create(job)
    .then((job) => {
      res.status(200);
      res.json({ data: job._id, status: 200 });
    })
    .catch((error) => {
      res.status(error.status || 500);
      res.json(error);
    });
});

router.get('/manage/:id', (req, res) => {
  jobs.findById(req.params.id).then(
    (job) => {
      res.render('manage', {
        css: req.app.locals.css.concat('/css/manage.css'),
        js: req.app.locals.js.concat('/js/atomic.min.js', '/js/manage.js'),
        job: job
      });
    },
    (err) => {
      res.render('error', {
        title: 'Not found',
        error: {
          name: 'Could not find specified monitor value',
          description: `There is no current monitor value with id "<b>${
            req.params.id
          }</b>"`
        }
      });
    }
  );
});

router.post('/manage/:id/enable', (req, res) => {
  // TODO: handle errors
  jobs
    .findById(req.params.id)
    .then(jobs.enable)
    .then(() => {
      res.status(200);
      res.end();
    });
});

router.post('/manage/:id/disable', (req, res) => {
  // TODO: handle errors
  jobs
    .findById(req.params.id)
    .then(jobs.disable)
    .then(() => {
      res.status(200);
      res.end();
    });
});

router.post('/manage/:id/delete', (req, res) => {
  // TODO: handle errors
  jobs
    .findById(req.params.id)
    .then(jobs.remove)
    .then(() => {
      res.status(200);
      res.end();
    });
});

router.get('/manage/:id/edit', (req, res) => {
  jobs.findById(req.params.id).then((job) => {
    res.render('edit', {
      job: job,
      production: config.production,
      css: req.app.locals.css.concat('/css/form.css'),
      js: req.app.locals.js.concat('/js/atomic.min.js', '/js/form.js')
    });
  });
});

router.post('/manage/:id/edit', (req, res) => {
  const job = {
    title: typeof req.body.title === 'string' ? req.body.title : '',
    url: typeof req.body.url === 'string' ? req.body.url : '',
    selector: typeof req.body.selector === 'string' ? req.body.selector : '',
    mode: typeof req.body.mode === 'string' ? req.body.mode : '',
    days:
      req.body.days && typeof req.body.days === 'object'
        ? Object.keys(req.body.days)
        : [],
    interval: typeof req.body.interval === 'string' ? req.body.interval : ''
  };

  jobs.edit(req.params.id, job).then((job) => {
    res.status(200);
    res.json({ data: job._id, status: 200 });
  });
});

router.use('/feed', feed.router);

module.exports = router;
