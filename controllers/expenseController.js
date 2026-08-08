const Expense = require('../models/Expense');

// GET /api/expenses — returns all expenses, with optional filters
const getAllExpenses = async (req, res) => {
  try {
    const { category, search, minAmount, maxAmount } = req.query;

    // Build a MongoDB filter object based on whichever query params were provided
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (search) {
      // $regex with "i" option = case-insensitive search, similar to
      // what .toLowerCase().includes() did with the fs version
      filter.title = { $regex: search, $options: 'i' };
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/expenses/stats — returns a summary of spending
const getExpenseStats = async (req, res) => {
  try {
    const expenses = await Expense.find({});

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const byCategory = {};
    expenses.forEach((exp) => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = { count: 0, total: 0 };
      }
      byCategory[exp.category].count += 1;
      byCategory[exp.category].total += exp.amount;
    });

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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/expenses/:id — returns ONE expense by its id
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (err) {
    // If the id isn't a validly-formatted MongoDB ObjectId, Mongoose throws
    // a CastError — we treat that the same as "not found" rather than a 500
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/expenses — creates a new expense
const createExpense = async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    const newExpense = await Expense.create({
      title,
      amount: Number(amount),
      category,
      description: description || '',
      date: date || undefined, // let the schema default kick in if not provided
    });

    res.status(201).json({ success: true, data: newExpense });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/expenses/:id — updates an existing expense (partial update allowed)
const updateExpense = async (req, res) => {
  try {
    // Strip out "id" and "createdAt" from the request body — these should
    // never be changed after creation
    const { id, createdAt, ...updates } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true } // return the UPDATED doc, and re-validate against the schema
    );

    if (!updatedExpense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, data: updatedExpense });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/expenses/:id — removes an expense
const deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// BONUS — GET /api/expenses/export — downloads all expenses as a .csv file
const exportExpensesCSV = async (req, res) => {
  try {
    const expenses = await Expense.find({});

    const headers = ['ID', 'Title', 'Amount', 'Category', 'Date', 'Description', 'Created At'];

    const rows = expenses.map((exp) =>
      [
        exp.id,
        exp.title,
        exp.amount,
        exp.category,
        exp.date,
        `"${(exp.description || '').replace(/"/g, '""')}"`,
        exp.createdAt.toISOString(),
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseStats,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesCSV,
};