const mongoose = require('mongoose');

// This schema defines the shape of every expense document stored in MongoDB.
// Mongoose validates data against this schema before saving it.
const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['food', 'transport', 'shopping', 'utilities', 'health', 'other'],
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0], // defaults to today
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    // Automatically adds a "createdAt" field when a document is first saved.
    // We don't need "updatedAt", so it's turned off.
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// By default, MongoDB documents come back with "_id" (an ObjectId) instead
// of a plain "id". This transform renames "_id" to "id" and removes internal
// Mongoose fields ("__v") whenever a document is converted to JSON —
// this is what keeps our API response shape identical to before, so the
// frontend doesn't need any changes.
expenseSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('Expense', expenseSchema);