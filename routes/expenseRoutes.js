const express = require('express');    //import express
const router = express.Router();     // a mini "sub-app" just for expense-related routes

const {
  getAllExpenses,
  getExpenseStats,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesCSV,
} = require('../controllers/expenseController');

const validate = require('../middleware/validate');

// ⚠️ ORDER MATTERS: specific routes like /stats and /export must come BEFORE /:id
// Otherwise Express thinks "stats" or "export" is an id value and never reaches these routes
router.get('/stats', getExpenseStats);
router.get('/export', exportExpensesCSV);

router.get('/', getAllExpenses);       // GET all expenses (with optional filters)
router.get('/:id', getExpenseById);   // GET one expense by id


// validate(...) runs FIRST — if title/amount/category are missing, it stops here
// only if validation passes does createExpense actually run
router.post('/', validate('title', 'amount', 'category'), createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;