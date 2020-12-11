const later = require('later');
const pify = require('pify');
const { URL } = require('url');
const Job = require('mongoose').model('Job');
const notify = require('./notify.js');
const browser = require('./browser.js');
const config = require('./config.js');

const runningJobs = {};

Object.assign(exports, {
  start(job) {
    if (!job.enabled || runningJobs[job._id]) {
      return;
    }

    const schedule = later.parse.text(job.interval, !config.production);

    runningJobs[job._id] = later.setInterval(() => {
      browser
        .execute(job)
        .then((result) => updateValue(job, result))
        .catch((error) => updateValue(job, error));
    }, schedule);
  },

  getAll() {
    return Job.find().exec();
  },

  findById(id, projection) {
    return Job.findById(id, projection).exec();
  },

  enable(job) {
    if (job.enabled && runningJobs[job._id]) {
      return Promise.resolve();
    }

    job.enabled = true;

    return pify(job.save)
      .apply(job)
      .then(clearJob);
  },

  disable(job) {
    if (!job.enabled) {
      return Promise.resolve();
    }

    job.enabled = false;

    return pify(job.save)
      .apply(job)
      .then(exports.restart); // restart just in case
  },

  restart(job) {
    clearJob(job);
    exports.start(job);
  },

  remove(job) {
    return pify(job.remove)
      .apply(job)
      .then(clearJob);
  },

  create(body) {
    return Job.create(bodyToJob(body)).then((job) => {
      exports.start(job);
      return job;
    });
  },

  edit(id, body) {
    return Job.findByIdAndUpdate(id, bodyToJob(body), { new: true }).then(
      (job) => {
        exports.restart(job);
        return job;
      }
    );
  }
});

// TODO: handle errors
exports.getAll().then((jobs) => {
  for (const job of jobs) {
    exports.start(job);
  }
});

function clearJob(job) {
  if (runningJobs[job._id]) {
    runningJobs[job._id].clear();
    delete runningJobs[job._id];
  }
}

function updateValue(job, newValue) {
  const oldValue = job.values.slice(-1)[0] || {};

  if (oldValue.kind !== newValue.kind || oldValue.value !== newValue.value) {
    job.values.push(newValue);

    // TODO: handle errors
    pify(job.save)
      .apply(job)
      .then((job) => {
        console.log(
          `${job._id}: ` +
            (oldValue.time
              ? `(${oldValue.time.toLocaleString()}) ${oldValue.value} => `
              : '') +
            `(${newValue.time.toLocaleString()}) ${newValue.value}`
        );
        notify.send(job, oldValue, newValue);
      });
  }
}

function bodyToJob(body) {
  let url = body.url;

  // Has to be HTTP
  if (!/^https?:\/\//i.test(body.url)) {
    if (/^[a-z]+:\/\//i.test(body.url)) {
      return Promise.reject({ message: 'URL must be HTTP(S)', status: 400 });
    }

    url = `http://${body.url}`;
  }

  try {
    // Throws error if invalid
    url = new URL(url).href;
  } catch (e) {
    return Promise.reject({ message: 'URL invalid', status: 400 });
  }

  const weekDays = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
  ];
  const days = body.days.filter((day) => weekDays.indexOf(day) >= 0).join(',');
  let interval = 'every ';

  switch (body.interval) {
    case '1':
      interval += '5 minutes';
      break;
    case '2':
      interval += '15 minutes';
      break;
    case '3':
      interval += '30 minutes';
      break;
    case '4':
      interval += '1 hour';
      break;
    case '5':
      interval += '3 hours';
      break;
    case '6':
      interval += '6 hours';
      break;
    case '7':
      interval += '12 hours';
      break;
    default:
      if (body.interval === '0' && !config.production) {
        interval += '15 seconds';
      } else {
        interval += '1 hour';
      }
      break;
  }

  if (days.length) {
    interval += ` on ${days}`;
  }

  return {
    title: body.title,
    url: url,
    query: {
      // Default mode is 'query'
      mode:
        body.mode === 'query' || body.mode === 'regex' ? body.mode : 'query',
      selector: body.selector
    },
    interval: interval
  };
}
