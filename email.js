const nodemailer = require('nodemailer')
const nunjucks = require('nunjucks').configure('./views')
const pify = require('pify')
const config = require('./config.js')
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: config.email.username,
    pass: config.email.password
  }
})
const sendMail = pify(transporter.sendMail.bind(transporter))

exports = module.exports = {
  send(job, oldValue, newValue) {
    if (!config.email.consoleOnly) {
      sendMail({
        from: config.email.from,
        to: config.email.to,
        subject: 'WebMonitor - ' + job.title,
        html: formatEmail(job, oldValue, newValue)
      }).catch(error => {
        console.error('Email send error:', error)
      })
    } else {
      console.log('Send Email:', {
        title: job.title,
        url: job.url,
        id: job.id,
        old: oldValue,
        new: newValue
      })
    }
  }
}

function formatEmail(job, oldValue, newValue) {
  return nunjucks.render('email.html', {
    job: job,
    oldValue: oldValue,
    newValue: newValue,
    domain: config.domain
  })
}
