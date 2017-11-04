exports = module.exports = {
  root: __dirname,
  production: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 3000,
  domain: process.env.MONITOR_DOMAIN,
  email: {
    service: process.env.EMAIL_SERVICE,
    username: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    to: process.env.EMAIL_TO,
    from: process.env.EMAIL_FROM,
    consoleOnly: false
  }
}

if (!exports.production) {
  exports.email.consoleOnly = true
}

if (!exports.domain) {
  exports.domain = `http://localhost:${exports.port}`
}
