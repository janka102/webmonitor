const puppeteer = require('puppeteer');
const config = require('./config.js');

Object.assign(exports, {
  async execute(job) {
    const browser = await puppeteer.launch({ args: config.puppeteer_args });
    const page = await browser.newPage();

    let result = null;
    let error = null;

    try {
      await page.goto(job.url, {
        timeout: 15 * 1000,
        waitUntil: 'networkidle2'
      });

      result = await page.evaluate((query) => {
        let search = '';

        if (query.mode === 'query') {
          const el = document.querySelector(query.selector);
          search = el ? el.textContent.trim() : '';
        } else if (query.mode === 'regex') {
          const match = document.body.textContent.match(
            new RegExp(query.selector)
          );
          search = match ? match[0].trim() : '';
        }

        const number = Number(search);

        if (search.length && !isNaN(number)) {
          search = number;
        }

        return search;
      }, job.query);
    } catch (e) {
      error = e;
    }

    await browser.close();

    if (error) {
      return Promise.reject({
        time: new Date(),
        value: error.message,
        kind: 'error'
      });
    }

    return {
      time: new Date(),
      value: result,
      kind: typeof result === 'string' ? 'text' : 'number'
    };
  }
});
