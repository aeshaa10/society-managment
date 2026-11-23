const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    emiAmount: {
      type: Number,
      required: true,
    },
    principalComponent: {
      type: Number,
      required: true,
    },
    interestComponent: {
      type: Number,
      required: true,
    },
    outstandingPrincipal: {
      // Balance remaining AFTER this installment is paid
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'waived'],
      default: 'pending',
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paidAmount: {
      type: Number,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online', 'cheque', null],
      default: null,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Composite unique index: one installment per number per loan
installmentSchema.index({ loanId: 1, installmentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Installment', installmentSchema);
