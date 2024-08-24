const winston = require('winston');
const expressWinston = require('express-winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'application.log' })
    ]
});

// Request logger
function requestLogger(req, res, next) {
    logger.info({
      message: "Request logged",
      method: req.method,
      path: req.path,
      query: req.query,
      timestamp: new Date().toISOString(),
    });
    next();
  }
  
  // Error logger
  function errorLogger(err, req, res, next) {
    logger.error({
      message: "Error logged",
      error: err.stack,
      timestamp: new Date().toISOString(),
    });
    next(err);
  }
  
  module.exports = {
      requestLogger,
      errorLogger
    };