const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. MEMBER_CREATED, LOAN_APPROVED, DEPOSIT_MADE, etc.
    },
    targetModel: {
      type: String,
      // e.g. 'Member', 'Loan', 'SavingsAccount'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Audit logs should never be modified after creation
  }
);

// Index for quick admin queries
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
