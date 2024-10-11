const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const reqLogger = createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [new transports.File({ filename: "application.log" })],
});

function requestLogger(req, res, next) {
  const logMessage = `Method: ${req.method}, Path: ${req.path}, Query: ${JSON.stringify(req.query)}`;
  reqLogger.info(logMessage);
  next();
}

// Custom error logging function

const errLogger = createLogger({
  level: "error",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [new transports.File({ filename: "error.log" })],
});

function errorLogger(err, req) {
  const errorMessage = `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
  errLogger.error(errorMessage);
}

module.exports = { requestLogger, errorLogger };
