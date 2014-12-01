var express = require('express'),
    app = express(),

    morgan = require('morgan'),
    compression = require('compression'),
    bodyParser = require('body-parser'),

    path = require('path'),
    jobs = require('./jobs'),
    port = process.env.PORT || 3000;

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

// Open the port for business
app.listen(port, function() {
    console.log('Now running on port %d', port);
});

jobs.startAll();
