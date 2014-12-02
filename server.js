var express = require('express'),
    app = express(),

    morgan = require('morgan'),
    compression = require('compression'),
    bodyParser = require('body-parser'),

    path = require('path'),
    jobs = require('./jobs'),
    port = parseInt(process.env.PORT || 3000);

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

    if (port !== 80 && port !== 443) {
        user.domain += ':' + port;
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

// Public files
app.use(express.static(path.join(__dirname, 'site')));

app.post('/monitor', function(req, res) {
    console.log('Body:', req.body);
    
    jobs.create(req.body).then(function(job) {
        res.send(job);
    });
});

app.get('/stop/:id', function(req, res) {
    // TODO: implement removing jobs
});

// Open the port for business
app.listen(port, function() {
    console.log('Now running on port %d', port);
});

jobs.startAll();
