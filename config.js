module.exports = {
    port: parseInt(process.env.PORT || 3000),
    dev: (process.env.NODE_ENV || 'development') === 'development'
};