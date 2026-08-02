// This file contains all the LOGIC for handling expense requests.
// It never touches fs directly — it only uses readExpenses/writeExpenses.
const { readExpenses, writeExpenses } = require('../utils/fileHelper');

// GET /api/expenses — returns all expenses, with optional filters
const getAllExpenses = (req, res) => {
  // req.query gives us anything after the ? in the URL, like ?category=food
  const { category, search, minAmount, maxAmount } = req.query;

  let expenses = readExpenses(); // load everything first

  // Apply each filter ONLY if it was actually provided in the URL
  if (category) {
    //marching categories
    expenses = expenses.filter(exp => exp.category === category);
  }
  if (search) {
    // toLowerCase on both sides so search is case-insensitive
    expenses = expenses.filter(exp =>
      exp.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (minAmount) {
    expenses = expenses.filter(exp => exp.amount >= Number(minAmount));
  }
  if (maxAmount) {
    expenses = expenses.filter(exp => exp.amount <= Number(maxAmount));
  }
 //snd filtered data to frontend
  res.json({ success: true, count: expenses.length, data: expenses });
};


// GET /api/expenses/stats — returns a summary of spending
const getExpenseStats = (req, res) => {
  const expenses = readExpenses();

  const totalExpenses = expenses.length;
  // reduce() adds up all the amounts into one total number
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Build a breakdown /summary per category, e.g. { food: { count: 2, total: 4500 } }
  const byCategory = {};
  expenses.forEach(exp => {
    if (!byCategory[exp.category]) {
      byCategory[exp.category] = { count: 0, total: 0 }; // first time seeing this category
    }
    byCategory[exp.category].count += 1;
    byCategory[exp.category].total += exp.amount;
  });

  // Find the biggest and smallest expense (only if there are any expenses at all)
  let highestExpense = null;
  let lowestExpense = null;
  if (expenses.length > 0) {
    highestExpense = expenses.reduce((max, exp) => (exp.amount > max.amount ? exp : max));
    lowestExpense = expenses.reduce((min, exp) => (exp.amount < min.amount ? exp : min));
  }

  res.json({
    success: true,
    data: {
      totalExpenses,
      totalAmount,
      byCategory,
      highestExpense: highestExpense
        ? { title: highestExpense.title, amount: highestExpense.amount }
        : null,
      lowestExpense: lowestExpense
        ? { title: lowestExpense.title, amount: lowestExpense.amount }
        : null,
    },
  });
};

// GET /api/expenses/:id — returns ONE expense by its id
const getExpenseById = (req, res) => {
  // req.params.id comes from the URL, e.g. /api/expenses/123 → "123"
  // it's always a string, so we convert it to a number with parseInt
  const id = parseInt(req.params.id);

  const expenses = readExpenses();
  const expense = expenses.find(exp => exp.id === id);

  if (!expense) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }
  res.json({ success: true, data: expense });
};

// POST /api/expenses — creates a new expense
const createExpense = (req, res) => {
  // req.body is the JSON data sent from the frontend form
  const { title, amount, category, description, date } = req.body;

  const expenses = readExpenses();

  const newExpense = {
    id: Date.now(),                                    // unique id based on current timestamp
    title,
    amount: Number(amount),                             // make sure it's stored as a number, not string
    category,
    date: date || new Date().toISOString().split('T')[0], // if no date given, use today (YYYY-MM-DD)
    description: description || '',                     // optional, defaults to empty string
    createdAt: new Date().toISOString(),                 // exact timestamp of creation
  };

  expenses.push(newExpense);   // add new expense to the array
  writeExpenses(expenses);     // save the updated array back to the file

  res.status(201).json({ success: true, data: newExpense }); // 201 = "created successfully"
};

// PUT /api/expenses/:id — updates an existing expense (partial update allowed)
const updateExpense = (req, res) => {
  const id = parseInt(req.params.id);
  const expenses = readExpenses();

  // findIndex tells us WHERE in the array this expense is (so we can replace it)
  const index = expenses.findIndex(exp => exp.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  // We deliberately ignore any "id" or "createdAt" sent by the user —
  // those should never be changed after creation
  const { id: ignoredId, createdAt: ignoredCreatedAt, ...updates } = req.body;

  // Spread operator: keep old fields, overwrite only the ones provided in "updates"
  expenses[index] = { ...expenses[index], ...updates };
  writeExpenses(expenses);

  res.json({ success: true, data: expenses[index] });
};

// DELETE /api/expenses/:id — removes an expense
const deleteExpense = (req, res) => {
  const id = parseInt(req.params.id);
  const expenses = readExpenses();
  const index = expenses.findIndex(exp => exp.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  expenses.splice(index, 1); // remove exactly 1 item at position "index"
  writeExpenses(expenses);

  res.json({ success: true, message: 'Expense deleted successfully' });
};

// BONUS — GET /api/expenses/export — downloads all expenses as a .csv file
const exportExpensesCSV = (req, res) => {
  const expenses = readExpenses();

   // First row of any CSV is always the column headers
  const headers = ['ID', 'Title', 'Amount', 'Category', 'Date', 'Description', 'Created At'];

   // First row of any CSV is always the column headers
  const rows = expenses.map(exp => [
    exp.id,
    exp.title,
    exp.amount,
    exp.category,
    exp.date,
     // Wrap description in quotes and escape any existing quotes,
    // otherwise a comma inside the description would break the CSV columns
    `"${(exp.description || '').replace(/"/g, '""')}"`, // escape quotes inside description
    exp.createdAt,
  ].join(','));

    // Join header row + all data rows with newlines — this is the full CSV file as text
  const csvContent = [headers.join(','), ...rows].join('\n');

  // These headers tell the browser "this is a file to download", not a normal JSON response
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.status(200).send(csvContent);
};

// Update module.exports — add exportExpensesCSV
module.exports = {
  getAllExpenses,
  getExpenseStats,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesCSV,
};
