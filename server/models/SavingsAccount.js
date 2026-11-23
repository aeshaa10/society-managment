const mongoose = require('mongoose');

const savingsAccountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      unique: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    minimumBalance: {
      type: Number,
      default: 500,
    },
    status: {
      type: String,
      enum: ['active', 'frozen', 'closed'],
      default: 'active',
    },
    openedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Auto-generate account number
savingsAccountSchema.pre('save', async function (next) {
  if (!this.accountNumber) {
    const count = await mongoose.model('SavingsAccount').countDocuments();
    this.accountNumber = `SAV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('SavingsAccount', savingsAccountSchema);
