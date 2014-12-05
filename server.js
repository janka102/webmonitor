var express = require('express'),
    app = express(),

    morgan = require('morgan'),
    compression = require('compression'),
    bodyParser = require('body-parser'),
    swig = require('swig'),

    path = require('path'),
    util = require('util'),
    config = require('./config'),
    jobs = require('./jobs');

// Add the port to the domain
if (config.port !== 80 && config.port !== 443) {
    config.domain += ':' + config.port;
}

// Setup the server
app.use(compression());

app.use(morgan(config.dev ? 'dev' : 'tiny'));

app.use(bodyParser.urlencoded({
    extended: false
}));

swig.setDefaults({
    cache: config.dev ? false : 'memory'
});

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Public files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.render('index', {
        dev: config.dev
    });
});

app.post('/monitor', function(req, res) {
    console.log('Body:', req.body);

    jobs.create(req.body).then(function(job) {
        res.send(job);
    });
});

app.route('/stop/:id')
    .get(function(req, res) {
        jobs.findOne({
            id: req.params.id
        }).then(function(job) {
            res.render('stop', {
                job: job,
                domain: config.domain
            });
        }, function(err) {
            res.render('404', {
                error: {
                    name: 'Not found',
                    title: 'Could not find specified monitor value',
                    description: 'There is no current monitor value with id "<b>' + req.params.id + '</b>"'
                },
                domain: config.domain
            });
        });
    })
    .post(function(req, res) {
        jobs.findOne({
            id: req.params.id
        }).then(function(job) {
            jobs.remove(job);

            res.send(200);
        }, function(err) {
            res.status(404).end(JSON.stringify({
                error: err
            }));
        });
    });

// Catch-all/404
app.get('*', function(req, res) {
    res.render('404', {
        error: {
            name: 'Not Found',
            title: '404 - Page not found',
            description: 'The page at <b>' + req.path + '</b> was not found. Go <a href="' + user.domain + '">home</a>.'
        }
    })
});

// Open the port for business
app.listen(config.port, function() {
    console.log('Now running on port %d', config.port);
});

jobs.startAll();
