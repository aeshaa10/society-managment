const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      unique: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    loanType: {
      type: String,
      enum: ['personal', 'emergency', 'business', 'education'],
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: [true, 'Requested amount is required'],
      min: [1000, 'Minimum loan amount is ₹1,000'],
    },
    approvedAmount: {
      type: Number,
      default: null,
    },
    interestRate: {
      type: Number,
      required: [true, 'Interest rate is required'],
      // Annual percentage, stored at time of application
    },
    tenureMonths: {
      type: Number,
      required: [true, 'Tenure is required'],
      min: 1,
      max: 120,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
    },
    emi: {
      type: Number,
      default: null,
    },
    totalRepayable: {
      type: Number,
      default: null,
    },
    totalInterest: {
      type: Number,
      default: null,
    },
    outstandingBalance: {
      type: Number,
      default: null,
    },
    disbursedAmount: {
      type: Number,
      default: null,
    },
    disbursedDate: {
      type: Date,
      default: null,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'],
      default: 'pending',
    },
    remarks: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedDate: {
      type: Date,
      default: null,
    },
    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    closedDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate loan ID
loanSchema.pre('save', async function (next) {
  if (!this.loanId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Loan').countDocuments();
    this.loanId = `LN-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
