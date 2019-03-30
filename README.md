# WebMonitor
Monitor values on the web, and get emailed when they change.

- Set a custom check interval
- Query values with `RegExp` or `document.querySelector`

## Setup
Create a `.env` file for data that will be used with [nodemailer](https://github.com/andris9/Nodemailer). Also change the `MONITOR_DOMAIN` to a domain that will be used to link to the site from within the emails, don't include a trailing slash.

```
NODE_ENV=
PORT=  // default 3000
MONITOR_DOMAIN=  // default http://localhost:PORT
MONGOOSE_URL=  // default mongodb://localhost:21017/webmonitor
PUPPETEER_ARGS=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_FROM=
EMAIL_TO=
```

To enable the emails, set `NODE_ENV` to `production`.

## License (ISC)
[View License](./LICENSE)