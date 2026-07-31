const fs = require('fs');       // built-in module to read/write files
const path = require('path');   // built-in module to safely build file paths

// This builds the full path to our data file
// __dirname = current folder (utils), '..' = go up one level, then into data/expenses.json
const DATA_FILE = path.join(__dirname, '..', 'data', 'expenses.json');

// This function READS all expenses from the JSON file
function readExpenses() {
  try {
    // If the file doesn't exist yet (e.g. no expense added ever), return empty array
    if (!fs.existsSync(DATA_FILE)) return [];

    // Read the file as text
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');

    // Convert that text into a real JavaScript array
    return JSON.parse(raw);
  } catch (err) {
    // If anything goes wrong (corrupted file, etc.), don't crash — just return empty array
    return [];
  }
}

// This function WRITES the expenses array back into the JSON file
function writeExpenses(expenses) {
  const dir = path.dirname(DATA_FILE); // gets the folder path (data/)

  // If the data/ folder doesn't exist, create it first
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Save the array as nicely formatted JSON (null, 2 = pretty-print with 2-space indent)
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}

// Export both functions so controllers can use them
module.exports = { readExpenses, writeExpenses };