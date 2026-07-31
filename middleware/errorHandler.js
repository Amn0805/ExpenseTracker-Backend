// Express recognizes this as an error-handling middleware ONLY because it has
// exactly 4 parameters (err, req, res, next) — don't remove "next" even if unused!
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;               // use custom status if set, else 500 (server error)
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${status}: ${message}`); // log it for debugging

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;