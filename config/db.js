const mongoose = require('mongoose');

// This function connects to MongoDB using the connection string from .env.
// It's called once when the server starts, before app.listen().
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1); // stop the app if we can't connect to the database
  }
}

module.exports = connectDB;