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
    if (!config.email.dev) {
        sendMail({
            from: config.email.fromEmail,
            to: config.email.toEmail,
            subject: 'WebMonitor - ' + job.name,
            html: formatEmail(job, oldValue, newValue)
        }).then(undefined, function(err) {
            console.error('Email send error:', error);
        });
    } else {
        console.log({
            name: job.name,
            url: job.url,
            id: job.id,
            old: oldValue,
            new: newValue
        });
    }
}

function formatEmail(job, oldValue, newValue) {
    return swig.renderFile('./views/email.html', {
        job: job,
        oldValue: oldValue,
        newValue: newValue,
        domain: config.domain
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
