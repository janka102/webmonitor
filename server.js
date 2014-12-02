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

app.get('/stop/:key', function(req, res) {
    jobs.findOne({
        stopKey: req.params.key
    }).then(function(job) {
        res.render('stop', {
            job: job
        });
    });
});

// Open the port for business
app.listen(config.port, function() {
    console.log('Now running on port %d', config.port);
});

// jobs.startAll();
