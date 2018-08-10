const nunjucks = require('nunjucks').configure('./views');
const pify = require('pify');
const nodemailer = require('nodemailer');
const htmlToText = require('nodemailer-html-to-text').htmlToText;
const feed = require('./feed.js');
const config = require('./config.js');
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.username,
    pass: config.email.password
  }
});
const sendMail = pify(transporter.sendMail.bind(transporter));

transporter.use('compile', htmlToText());

Object.assign(exports, {
  send(job, oldValue, newValue) {
    if (config.feed) {
      feed.addItem(job, oldValue, newValue);
    }

    if (config.email.enabled) {
      sendMail({
        from: config.email.from,
        to: config.email.to,
        subject: 'WebMonitor - ' + job.title,
        html: formatHTML(job, oldValue.value, newValue.value)
      }).catch((error) => {
        console.error('Email send error:', error);
      });
    }

    if (config.consoleUpdate) {
      console.log('Send Email:', {
        title: job.title,
        url: job.url,
        id: job.id,
        old: oldValue,
        new: newValue
      });
    }
  },
  formatHTML: formatHTML
});

function formatHTML(job, oldValue, newValue) {
  return nunjucks.render('email.html', {
    job: job,
    oldValue: oldValue,
    newValue: newValue,
    domain: config.domain
  });
}
