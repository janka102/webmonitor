var Promise = require('bluebird'),
    nodemailer = require('nodemailer'),
    swig = require('swig'),
    util = require('util'),
    config = require('./config'),
    transporter = nodemailer.createTransport({
        service: config.email.service,
        auth: {
            user: config.email.user,
            pass: config.email.pass
        }
    }),
    // For some reason Promise.promisify didn't work
    sendMail = function(options) {
        return new Promise(function(resolve, reject) {
            transporter.sendMail(options, function(err, info) {
                if (err) {
                    return reject(err);
                }

                resolve(info);
            });
        });
    };

exports.send = function(job, oldValue, newValue) {
    return sendMail({
        from: config.email.fromEmail,
        to: config.email.toEmail,
        subject: 'WebMonitor - ' + job.name,
        html: formatEmail(job, oldValue, newValue)
    }).then(function(info) {
        console.log('Sent an email to %s for their "%s"', job.email, job.name);
        console.log(info);
    });
}

function formatEmail(job, oldValue, newValue) {
    return swig.renderFile('./views/email.html', {
        job: job,
        oldValue: oldValue,
        newValue: newValue,
        domain: user.domain
    });
}

function escapeHTML(string) {
    return string.replace(/[&<>"']/g, function(val) {
        switch (val) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case '\'':
                return '&#39;';
        }
    });
}
