// Load environment variables from .env FIRST, before anything else needs them
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const expenseRoutes = require('./routes/expenseRoutes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Development mein Vite kabhi kabhi different port use kar leta hai
// (5173 busy ho to khud 5174, 5175... pe shift ho jata hai)
// Isliye hum common ports ki list allow kar rahe hain, ek fixed port ki jagah
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',

  // Vercel frontend
  'https://expense-tracker-frontend-nu-six.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Postman/curl se request aaye to origin undefined hota hai — unhe allow karo
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// This lets Express understand JSON sent in POST/PUT requests (req.body)
app.use(express.json());

// Our custom logger — runs on every single request
app.use(logger);

// A simple endpoint to check if the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All expense routes live under /api/expenses (e.g. /api/expenses, /api/expenses/5)
app.use('/api/expenses', expenseRoutes);

// This MUST be registered LAST — after all routes —
// so it can catch any errors thrown anywhere above it
app.use(errorHandler);

const PORT = process.env.PORT || 3000; // use .env value, or fallback to 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});