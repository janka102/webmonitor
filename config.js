exports = module.exports = {
  root: __dirname,
  production: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 3000,
  domain: process.env.MONITOR_DOMAIN,
  mongoose: process.env.MONGOOSE_URL || `tingodb://${__dirname}/data`,
  email: {
    service: process.env.EMAIL_SERVICE,
    username: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    consoleOnly: false
  }
}

if (!exports.production) {
  exports.email.consoleOnly = true
}

if (!exports.domain) {
  exports.domain = `http://localhost:${exports.port}`
}
