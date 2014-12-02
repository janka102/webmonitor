var Promise = require('bluebird'),
    later = require('later'),
    phridge = require('phridge'),
    crypto = require('crypto'),
    db = new(require('tingodb')()).Db('./monitor', {}),
    jobs = db.collection('jobs'),
    email = require('./email'),
    runningJobs = {};

function createInterval(job) {
    return function() {
        phridge.spawn()
            .then(function(phantom) {
                return phantom.openPage(job.url);
            })
            .then(function(page) {
                return page.run(job.pageQuery, function(pageQuery) {
                    // Here we're inside PhantomJS, so we can't reference variables in the scope

                    // 'this' is an instance of PhantomJS' WebPage
                    return this.evaluate(function(pageQuery) {
                        // Here we're *deeper* inside PhantomJS, so we can't reference variables in the scope
                        var search;

                        if (pageQuery.mode === 'query') {
                            search = document.querySelector(pageQuery.selector).textContent;
                        } else if (pageQuery.mode === 'regex') {
                            search = document.body.innerText.match(new RegExp(pageQuery.selector));
                        }

                        return search;
                    }, pageQuery);
                });
            })
            .finally(phridge.dispose)
            .done(function(newValue) {
                console.log('Job %s returned: "%s"', job.name, newValue);

                exports.pushValue(job, newValue);
            }, function(err) {
                console.error('pantom error', err);

                // throw err;
            });
    };
}

exports.pushValue = function update(job, newValue) {
    jobs.findOne({
        _id: job._id
    }, {
        values: 1
    }, function(err, dbJob) {
        if (err) {
            console.log('pushValue() findOne error:', err);
            return;
        }

        // var oldValue = (dbJob.values.slice(-1)[0] || {}).value;
        var oldValue = dbJob.values.slice(-1)[0];

        if (oldValue !== newValue) {
            jobs.update({
                _id: dbJob._id
            }, {
                $push: {
                    values: newValue
                }
            });

            console.log('Updated %s, was "%s", is now "%s"', job.name, oldValue, newValue);

            if (dbJob.values.length) {
                // console.log('Gonna send an email!');
                email.send(job, oldValue, newValue);
            }
        } else {
            console.log('%s had same value, old: "%s", new: "%s"', job.name, oldValue, newValue);
        }
    });
};

// Start an interval for the specified job
exports.start = function start(job) {
    if (runningJobs[job._id]) {
        exports.stop(job);
    }

    runningJobs[job._id] = later.setInterval(createInterval(job), job.schedule);

    console.log('Started', job.name);
};

// Stop the inteval of the specified job
exports.stop = function stop(job) {
    runningJobs[job._id].clear();

    delete runningJobs[job._id];

    console.log('Stopped', job.name);
};

// Create and insert a job into the DB
exports.create = function create(body) {
    return new Promise(function(resolve, reject) {
        var job = {
                values: []
            },
            referenceDays = 'sunday monday tuesday wednesday thrusday friday saturday'.split(' '),
            days = referenceDays.slice(), // clone array
            hours = parseInt(body.hours),
            minutes = parseInt(body.minutes),
            seconds = parseInt(body.seconds),
            schedule = later.parse.recur();

        // Populate the job object with info from the body
        job.name = body.name.slice(0, 100); // Limit to 100 character
        job.url = body.url;
        job.email = body.email.split(',')[0]; // Only get first email if multiple are specified
        job.pageQuery = {
            mode: body.mode === 'query' || body.mode === 'regex' ? body.mode : 'query', // Default to query
            selector: body.selector
        };
        job.stopKey = crypto.randomBytes(16).toString('hex');

        // Setup the schedule
        if (hours > 0) {
            schedule = schedule.every(hours).hour();
        }

        if (minutes > 0) {
            schedule = schedule.every(minutes).minute();
        }

        if (seconds > 0) {
            schedule = schedule.every(seconds).second();
        }

        // Only get days specified in the body and convert them to numbers
        days = days.filter(function(day) {
            return !!body[day];
        }).map(function(day) {
            return referenceDays.indexOf(day);
        });

        if (days.length > 0 && days.length < 7) {
            schedule = schedule.on.apply(schedule, days).dayOfWeek();
        }

        if (schedule.schedules.length) {
            job.schedule = {
                schedules: schedule.schedules
            };

            jobs.insert(job, function(err, result) {
                if (err) {
                    console.error('Create error:', err);
                    reject(err);
                    return;
                }

                result = result[0];

                console.log('Created', result.name);
                exports.start(result);
                resolve(result);
            });
        } else {
            reject(new Error('No schedule specified for job ' + job.name));
        }
    });
};

// Start all jobs currently in the DB
exports.startAll = function startAll() {
    jobs.find().each(function(err, job) {
        if (err) {
            console.error('startAll error:', err);
            return;
        }

        if (job) {
            exports.start(job);
        }
    });
};
