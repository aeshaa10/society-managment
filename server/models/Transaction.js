const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsAccount',
      default: null,
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
    },
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Installment',
      default: null,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'loan_disbursement', 'loan_repayment', 'adjustment'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be positive'],
    },
    balanceBefore: {
      type: Number,
      default: null,
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online', 'cheque'],
      default: 'cash',
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isReversal: {
      type: Boolean,
      default: false,
    },
    reversalOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
  },
  {
    timestamps: true,
    // Transactions must not be accidentally deleted
  }
);

// Auto-generate transaction ID
transactionSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const count = await mongoose.model('Transaction').countDocuments();
    this.transactionId = `TXN-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Performance indexes
transactionSchema.index({ memberId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ loanId: 1 });
transactionSchema.index({ accountId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
