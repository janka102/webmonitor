Object.assign(exports, {
  root: __dirname,
  production: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 3000,
  domain: process.env.MONITOR_DOMAIN,
  mongoose: process.env.MONGOOSE_URL || `mongodb://localhost:21017/webmonitor`,
  puppeteer_args: process.env.PUPPETEER_ARGS
    ? process.env.PUPPETEER_ARGS.split(' ')
    : [],
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    consoleOnly: false
  }
};

if (!exports.production) {
  exports.email.consoleOnly = true;
}

if (!exports.domain) {
  exports.domain = `http://localhost:${exports.port}`;
}
