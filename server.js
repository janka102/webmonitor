// Add items to `process.env`
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');
const path = require('path');
const config = require('./config.js');
const database = require('./database.js');

function startServer() {
  const app = express();
  const router = require('./router.js');

  // Setup the server
  if (!config.production) {
    app.use(morgan('dev'));
  } else {
    app.use(compression());
  }

  app.disable('x-powered-by');
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );

  // Set "./views" as the views folder
  nunjucks.configure('views', {
    express: app,
    noCache: !config.production
  });

  // Set default template extension to .html
  app.set('view engine', 'html');

  app.locals.css = ['/css/main.css'];
  app.locals.js = [];
  app.locals.domain = config.domain;

  // Public files
  app.use(express.static(path.join(config.root, 'public')));

  app.use(router);

  // Catch-all/404
  app.use((req, res, next) => {
    res.status(404);
    res.render('error', {
      title: 'Not Found',
      error: {
        name: '404 - Page not found',
        description: 'The page at <b>' + req.path + '</b> was not found. Go <a href="/">home</a>.'
      }
    });
  });

  // Open the port for business
  app.listen(config.port, () => {
    console.log(`=> Running on ${config.domain}`);
  });
}

database.init(err => {
  if (err) {
    console.error('Database error:', err);
    return;
  }

  startServer();
});
