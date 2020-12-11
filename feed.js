const Feed = require('feed').Feed;
const express = require('express');
const jobs = require('./jobs.js');
const notify = require('./notify.js');
const config = require('./config.js');

const router = express.Router();
const feed = new Feed({
  title: 'Web Monitor',
  description: 'Get updates on monitored values',
  id: config.domain,
  link: config.domain,
  copyright: 'All rights reserved 2018',
  feedLinks: {
    rss: `${config.domain}/feed/rss`,
    atom: `${config.domain}/feed/atom`,
    json: `${config.domain}/feed/json`
  }
});

let rss2 = null;
let atom1 = null;
let json1 = null;

router.get('/rss', (req, res) => {
  if (!rss2) {
    loadAllItems().then(() => {
      res.status(200);
      res.send(feed.rss2());
    });
    return;
  }

  res.status(200);
  res.send(feed.rss2());
});

router.get('/atom', (req, res) => {
  if (!atom1) {
    loadAllItems().then(() => {
      res.status(200);
      res.send(feed.atom1());
    });
    return;
  }

  res.status(200);
  res.send(feed.atom1());
});

router.get('/json', (req, res) => {
  if (!json1) {
    loadAllItems().then(() => {
      res.status(200);
      res.json(feed.json1());
    });
    return;
  }

  res.status(200);
  res.json(feed.json1());
});

Object.assign(exports, {
  router: router,
  addItem: addItem
});

function addItem(job, oldValue, newValue, updateCache = true) {
  feed.addItem({
    title: job.title,
    id: `${config.domain}/manage/${job.id}#${newValue.time}`,
    link: `${config.domain}/manage/${job.id}`,
    description: `Value changed from "${oldValue.value}" to "${
      newValue.value
    }"`,
    content: notify.formatHTML(job, oldValue.value, newValue.value),
    date: newValue.time
  });

  if (updateCache) {
    updateFeedCache();
  }
}

function updateFeedCache() {
  rss2 = feed.rss2();
  atom1 = feed.atom1();
  json1 = feed.json1();
}

async function loadAllItems() {
  return jobs.getAll().then((jobs) => {
    for (const job of jobs) {
      let oldValue = {};

      for (const newValue of job.values) {
        addItem(job, oldValue, newValue, false);
        oldValue = newValue;
      }
    }

    updateFeedCache();
  });
}
