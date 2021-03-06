Object.assign(exports, {
  root: __dirname,
  production: process.env.NODE_ENV === 'production',
  port: process.env.PORT || 3000,
  domain: process.env.MONITOR_DOMAIN,
  mongoose: process.env.MONGOOSE_URL || `mongodb://localhost:27017/webmonitor`,
  puppeteer_args: process.env.PUPPETEER_ARGS
    ? process.env.PUPPETEER_ARGS.split(' ')
    : [],
  feed: !process.env.DISABLE_FEED,
  email: {
    enabled: !process.env.DISABLE_EMAIL,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO
  },
  consoleUpdate: !!process.env.ENABLE_CONSOLE_UPDATES
});

if (!exports.domain) {
  exports.domain = `http://localhost:${exports.port}`;
}
