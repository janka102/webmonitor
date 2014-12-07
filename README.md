# WebMonitor
Monitor values on the web, and get emailed when they change.

- Set a custom check interval
- Query values with `RegExp` or `document.querySelector`

## Setup
In `config.json` populate the `email` object with data that will be used with [nodemailer](https://github.com/andris9/Nodemailer). Also change the `domain` to a domain that will be used to link to the site from within the emails, don't include a trailing slash.

```json
// config.email
{
    "service": "ex. Gmail or SendGrid",
    "user": "username for the service",
    "pass": "password for the service",
    "fromEmail": "email to send from",
    "toEmail": "email to send to"
}
```

If you only want to see value updates in the console for dev purposes, make `config.email.dev` a truthy value.

## License (ISC)
Copyright (c) 2014, Jesse Smick

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.