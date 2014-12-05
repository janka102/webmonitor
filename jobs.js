var Promise = require('bluebird'),
    later = require('later'),
    phridge = require('phridge'),
    crypto = require('crypto'),

    db = new(require('tingodb')()).Db('./monitor', {}),
    jobs = db.collection('jobs'),
    email = require('./email'),
    config = require('./config'),
    runningJobs = {};

// Start an interval for the specified job
exports.start = function(job) {
    if (runningJobs[job._id]) {
        exports.stop(job);
    }

    runningJobs[job._id] = later.setInterval(createInterval(job), job.schedule);
};

// Start all jobs currently in the DB
exports.startAll = function() {
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

// Stop the inteval of the specified job
exports.stop = function(job) {
    runningJobs[job._id].clear();

    delete runningJobs[job._id];
};

// Stop job and remove from DB
exports.remove = function(job) {
    exports.stop(job);

    return jobs.remove({
        _id: job._id
    }, true);
};

// Expose the find function
exports.find = jobs.find.bind(jobs);

// Wrap collection.findOne() in a promise
exports.findOne = function(criteria, projection) {
    var args = Array.prototype.slice.call(arguments);

    return new Promise(function(resolve, reject) {
        jobs.findOne.apply(jobs, args.concat([function(err, job) {
            if (err || !job) {
                reject(err || new Error('Job not found'));
                return;
            }

            resolve(job);
        }]));
    });
};

// Ifa  value changed add it to the DB
exports.pushValue = function(job, newValue) {
    exports.findOne({
        _id: job._id
    }, {
        values: 1
    }).then(function(dbJob) {
        var oldValue = (dbJob.values.slice(-1)[0] || {}).value;

        if (oldValue !== newValue) {
            jobs.update({
                _id: dbJob._id
            }, {
                $push: {
                    values: {
                        time: new Date(),
                        value: newValue
                    }
                }
            });

            if (dbJob.values.length) {
                email.send(job, oldValue, newValue);
            }
        }
    }, function(err) {
        console.error('pushValue() findOne error:', err);
    });
};

// Create and insert a job into the DB
exports.create = function(body) {
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
        job.title = body.title.slice(0, 100); // Limit to 100 character
        job.url = body.url;
        job.pageQuery = {
            // Default mode is 'query'
            mode: body.mode === 'query' || body.mode === 'regex' ? body.mode : 'query',
            selector: body.selector
        };
        job.id = crypto.randomBytes(16).toString('hex');

        // Setup the schedule
        if (hours > 0) {
            schedule = schedule.every(hours).hour();
        }

        if (minutes > 0) {
            schedule = schedule.every(minutes).minute();
        }

        if (config.dev && seconds > 0) {
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

                exports.start(result);
                resolve(result);
            });
        } else {
            reject(new Error('No schedule specified for job ' + job.title));
        }
    });
};

function getValueType(value) {
    var out = {
            type: ''
        },
        currencySymbol;

    value = value.trim();

    if (!value.length) {
        out.type = 'string';
    } else if (!isNaN(Number(value))) {
        out.type = 'number';
    } else if (currencySymbol = value.match(/^[$€£¥]|[$€£¥]$/)) {
        out.type = 'currency';

        if (value.indexOf(currencySymbol[0]) === 0) {
            currencySymbol = '^\\' + currencySymbol[0];
        } else {
            currencySymbol = '\\' + currencySymbol[0] + '$';
        }

        out.symbol = currencySymbol;
    } else {
        try {
            JSON.parse(value);

            out.type = 'json';
        } catch (e) {
            out.type = 'string';
        }
    }

    return out;
}

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
                exports.pushValue(job, newValue);
            }, function(err) {
                console.error('pantom error', err);
                // throw err;
            });
    };
}
