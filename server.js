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

// Append port to the users domain
// Also console specific error if the file doesn't exist
try {
    var user = require('./user.json');

    if (!(user.service && user.user && user.pass && user.email && user.domain)) {
        // File does not have all/any required values
        throw new Error();
    }

    // Remove any trailing slash
    if (user.domain.slice(-1) === '/') {
        user.domain = user.domain.slice(0, -1);
    }

    if (config.port !== 80 && config.port !== 443) {
        user.domain += ':' + config.port;
    }
} catch (e) {
    console.error('Create a user.json with {"service": "SERVICE", "user": "USERNAME", "pass": "PASSWORD", "email": "FROM_EMAIL", "domain":"YOUR_DOMAIN"}');
    throw e;
}

// Setup the server
app.use(compression());

app.use(morgan('dev'));

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

app.route('/stop/:id').get(function(req, res) {
    for (prop in jobs) {
        console.log(prop);
    }
    jobs.findOne({
        id: req.params.id
    }).then(function(job) {
        res.render('stop', {
            job: job,
            domain: user.domain
        });
    }, function(err) {
        res.render('404', {
            error: {
                name: 'Not found',
                title: 'Could not find specified monitor value',
                description: 'There is no current monitor value with id "<b>' + req.params.id + '</b>"'
            },
            domain: user.domain
        });
    });
}).post(function(req, res) {
    jobs.findOne({
        id: req.params.id
    }).then(function(job) {
        jobs.remove(job);

        res.status(200).end();
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
