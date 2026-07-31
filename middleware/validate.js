// This is a "factory function" — a function that returns another function.
// We call it like validate('title', 'amount', 'category') and it builds
// a custom middleware that checks exactly those fields.
const validate = (...fields) => (req, res, next) => {

  // Check which required fields are missing from the request body
  const missing = fields.filter(f => !req.body[f] && req.body[f] !== false);
  // (the "!== false" part makes sure a real value of `false` isn't wrongly treated as missing)

  if (missing.length > 0) {
    // Stop here and send an error — don't let the request continue
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  next(); // all required fields are present, continue to the actual controller
};

module.exports = validate;