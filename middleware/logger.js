// This middleware runs on EVERY request and just prints info about it in the terminal
const logger = (req, res, next) => {
  const time = new Date().toISOString();   // current time, e.g. 2026-07-30T10:00:00.000Z
  const method = req.method.padEnd(6);     // "GET" becomes "GET   " (6 chars) so logs line up nicely

  console.log(`[${time}] ${method} ${req.url}`);

  next(); // VERY IMPORTANT — tells Express "I'm done, move to the next step"
          // if you forget this, the request just hangs forever
};

module.exports = logger;