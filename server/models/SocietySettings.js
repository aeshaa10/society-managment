const mongoose = require('mongoose');

const loanTypeConfigSchema = new mongoose.Schema({
  name: String,
  maxAmount: Number,
  defaultInterestRate: Number,
  maxTenureMonths: Number,
});

const societySettingsSchema = new mongoose.Schema(
  {
    societyName: {
      type: String,
      default: 'Sahyog Co-operative Society',
    },
    registrationNumber: {
      type: String,
      default: 'CSR-2024-001',
    },
    address: {
      type: String,
      default: 'Pune, Maharashtra',
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: 'admin@sahyog.com',
    },
    defaultInterestRate: {
      type: Number,
      default: 12, // 12% per annum
    },
    minimumSavingsBalance: {
      type: Number,
      default: 500,
    },
    maxLoanTenureMonths: {
      type: Number,
      default: 60,
    },
    financialYear: {
      type: String,
      default: '2024-25',
    },
    loanTypes: {
      type: [loanTypeConfigSchema],
      default: [
        { name: 'personal', maxAmount: 500000, defaultInterestRate: 12, maxTenureMonths: 60 },
        { name: 'emergency', maxAmount: 100000, defaultInterestRate: 10, maxTenureMonths: 24 },
        { name: 'business', maxAmount: 1000000, defaultInterestRate: 14, maxTenureMonths: 60 },
        { name: 'education', maxAmount: 300000, defaultInterestRate: 8, maxTenureMonths: 48 },
      ],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocietySettings', societySettingsSchema);
