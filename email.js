var Promise = require('bluebird'),
    nodemailer = require('nodemailer'),
    util = require('util'),
    mailOptions = {
        subject: 'WebMonitor - %s',
        html: '<div style="width:100%;background-color:#e3e3e3;padding:35px;"><div style="color:#222;margin:auto;font-size:18px;font-family:sans-serif;max-width:650px;background-color:#f7f7f7;"><h2 style="color:#efefef;font-size:30px;background-color:#345;padding:25px 30px;margin:0;vertical-align:middle;">%s</h2><div style="display:block;padding:30px;"><span style="display:block;margin-bottom:40px">A value on your page <b>%s</b> changed.</span><span style="display:block;">It was:</span><span style="display:block;background-color:#e7dddd;border: 1px solid #dcc;padding:10px;margin:15px 25px 35px;">%s</span><span style="display:block;">It is now:</span><span style="display:block;background-color:#dde7dd;border: 1px solid #cdc;padding:10px;margin:15px 25px 35px;">%s</span></div><div style="display:block;font-size:13px;padding:15px;color:#656565;background-color:#c0c8cf;text-align:center;font-weight:bold;border-top: 1px solid #abc;">WebMonitor<span style="font-size:0;color:#c0c8cf;"> %s</span></div></div></div>'
    },
    user,
    transporter,
    sendMail;

try {
    user = require('./user.json');

    if (!(user.service && user.user && user.pass && user.email)) {
        throw new Error();
    }
} catch (e) {
    console.error('Create a user.json with {"service": "SERVICE", "user": "USERNAME", "pass": "PASSWORD", "email": "FROM_EMAIL"}');
    throw e;
}

transporter = nodemailer.createTransport({
    service: user.service,
    auth: {
        user: user.user,
        pass: user.pass
    }
});

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

exports.send = function(name, email, url, oldValue, newValue) {
    return sendMail({
        from: user.email,
        to: email,
        subject: util.format(mailOptions.subject, name),
        html: util.format(
            mailOptions.html,
            escapeHTML(name),
            escapeHTML(url),
            escapeHTML(oldValue),
            escapeHTML(newValue),
            (Math.random() * 100) | 0 // So Gmail doesn't see the last bit of the email as the same and hide it
            // TODO: Find a better way than putting a hidden random number in the email
        )
    }).then(function(info) {
        console.log('Sent an email to %s for their "%s"', email, name);
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
