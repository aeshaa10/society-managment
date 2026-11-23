const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'member_registered',
        'loan_applied',
        'loan_approved',
        'loan_rejected',
        'loan_disbursed',
        'repayment_recorded',
        'installment_due',
        'installment_overdue',
        'deposit_made',
        'withdrawal_made',
        'general',
      ],
      default: 'general',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Loan', 'Member', 'Transaction', 'Installment', null],
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
