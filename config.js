module.exports = {
    port: parseInt(process.env.PORT || 3000),
    dev: (process.env.NODE_ENV || 'development') === 'development',
    email: {
        service: 'SendGrid',
        user: 'janka102',
        pass: 'qUa0sGvTX1KQst',
        fromEmail: 'WebMonitor <jesse@smick.me>',
        toEmail: 'janka102@gmail.com',
        dev: true
    },
    domain: 'localhost'
};
