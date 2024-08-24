const rateLimit = require("express-rate-limit");

const rateLimiter = (timeMinutes = 3, maxNo = 10) =>
  rateLimit({
    windowMs: parseInt(timeMinutes) * 60 * 1000,
    max: parseInt(maxNo),
    keyGenerator: (req) => req.ip,
    message: "Too many login attempts, please try again later",
  });

module.exports = rateLimiter;