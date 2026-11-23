const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String, required: true },
  mobile: { type: String },
});

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
      // e.g. MEM-2024-001
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    occupation: {
      type: String,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    nomineeDetails: nomineeSchema,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    photo: {
      type: String,
    },
  },
  { timestamps: true }
);

// Auto-generate memberId before save
memberSchema.pre('save', async function () {
  if (!this.memberId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Member').countDocuments();
    this.memberId = `MEM-${year}-${String(count + 1).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('Member', memberSchema);
