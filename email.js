var Promise = require('bluebird'),
    nodemailer = require('nodemailer'),
    util = require('util'),
    mailOptions = {
        subject: 'WebMonitor - %s',
        html: require('fs').readFileSync('./views/email.html').toString()
    },
    user = require('./user.json'),
    transporter = nodemailer.createTransport({
        service: user.service,
        auth: {
            user: user.user,
            pass: user.pass
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
        from: user.email,
        to: job.email,
        subject: util.format(mailOptions.subject, job.name),
        html: formatEmail(job, oldValue, newValue)
    }).then(function(info) {
        console.log('Sent an email to %s for their "%s"', job.email, job.name);
        console.log(info);
    });
}

function formatEmail(job, oldValue, newValue) {
    return util.format(
        mailOptions.html,
        escapeHTML(job.name),
        job.url,
        escapeHTML(job.url),
        escapeHTML(oldValue),
        escapeHTML(newValue),
        user.domain,
        user.domain,
        job.stopKey
    )
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
