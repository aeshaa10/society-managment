/**
 * Seed Script — creates demo data for development
 * Run: npm run seed
 * WARNING: Clears existing data first!
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

// Also try loading from same dir
dotenv.config();

const User = require('../models/User');
const Member = require('../models/Member');
const SavingsAccount = require('../models/SavingsAccount');
const Loan = require('../models/Loan');
const Installment = require('../models/Installment');
const Transaction = require('../models/Transaction');
const SocietySettings = require('../models/SocietySettings');
const { calculateEMI, generateInstallmentSchedule } = require('../services/loanService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/csms_dev';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Clear all collections ──
  await Promise.all([
    User.deleteMany({}),
    Member.deleteMany({}),
    SavingsAccount.deleteMany({}),
    Loan.deleteMany({}),
    Installment.deleteMany({}),
    Transaction.deleteMany({}),
    SocietySettings.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Society Settings ──
  await SocietySettings.create({
    societyName: 'Sahyog Co-operative Credit Society',
    registrationNumber: 'MH-CSR-2024-001',
    address: '123, Shivaji Nagar, Pune - 411004, Maharashtra',
    phone: '+91 20 2345 6789',
    email: 'admin@sahyog.com',
    defaultInterestRate: 12,
    minimumSavingsBalance: 500,
    maxLoanTenureMonths: 60,
    financialYear: '2024-25',
  });

  // ── Admin User ──
  const admin = await User.create({
    name: 'Rajesh Sharma',
    email: 'admin@sahyog.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });

  // ── Staff Users ──
  const staff1 = await User.create({
    name: 'Priya Patel',
    email: 'staff1@sahyog.com',
    password: 'Staff@123',
    role: 'staff',
    isActive: true,
  });
  const staff2 = await User.create({
    name: 'Amit Kulkarni',
    email: 'staff2@sahyog.com',
    password: 'Staff@123',
    role: 'staff',
    isActive: true,
  });

  console.log('👤 Admin and staff accounts created');

  // ── Members ──
  const memberData = [
    { fullName: 'Suresh Nair', mobile: '9876543001', email: 'suresh.nair@email.com', city: 'Pune', occupation: 'Farmer', gender: 'Male', address: '12, Laxmi Nagar, Pune', dateOfBirth: new Date('1980-04-15') },
    { fullName: 'Anjali Deshmukh', mobile: '9876543002', email: 'anjali.d@email.com', city: 'Nashik', occupation: 'Teacher', gender: 'Female', address: '45, Panchvati, Nashik', dateOfBirth: new Date('1985-07-22') },
    { fullName: 'Ramesh Joshi', mobile: '9876543003', email: 'ramesh.j@email.com', city: 'Aurangabad', occupation: 'Shopkeeper', gender: 'Male', address: '7, Cidco Colony, Aurangabad', dateOfBirth: new Date('1978-11-30') },
    { fullName: 'Sunita Pawar', mobile: '9876543004', email: 'sunita.p@email.com', city: 'Pune', occupation: 'Self Employed', gender: 'Female', address: '23, Kothrud, Pune', dateOfBirth: new Date('1990-02-14') },
    { fullName: 'Mahesh Bhosale', mobile: '9876543005', email: 'mahesh.b@email.com', city: 'Satara', occupation: 'Farmer', gender: 'Male', address: '8, Main Road, Satara', dateOfBirth: new Date('1975-09-05') },
    { fullName: 'Kavita Shinde', mobile: '9876543006', email: 'kavita.s@email.com', city: 'Kolhapur', occupation: 'Nurse', gender: 'Female', address: '56, Rajarampuri, Kolhapur', dateOfBirth: new Date('1988-12-18') },
    { fullName: 'Dinesh Patil', mobile: '9876543007', email: 'dinesh.p@email.com', city: 'Solapur', occupation: 'Carpenter', gender: 'Male', address: '34, Hotgi Road, Solapur', dateOfBirth: new Date('1982-06-25') },
    { fullName: 'Meena Kamble', mobile: '9876543008', email: 'meena.k@email.com', city: 'Pune', occupation: 'Tailor', gender: 'Female', address: '78, Bibwewadi, Pune', dateOfBirth: new Date('1992-03-11') },
    { fullName: 'Arun Sawant', mobile: '9876543009', email: 'arun.s@email.com', city: 'Ratnagiri', occupation: 'Fisher', gender: 'Male', address: '2, Mirkarwada, Ratnagiri', dateOfBirth: new Date('1977-08-19') },
    { fullName: 'Pooja Waghmare', mobile: '9876543010', email: 'pooja.w@email.com', city: 'Nagpur', occupation: 'Homemaker', gender: 'Female', address: '15, Sitabuldi, Nagpur', dateOfBirth: new Date('1995-01-07') },
    { fullName: 'Sachin Munde', mobile: '9876543011', email: 'sachin.m@email.com', city: 'Latur', occupation: 'Mechanic', gender: 'Male', address: '9, Gandhi Chowk, Latur', dateOfBirth: new Date('1983-05-20') },
    { fullName: 'Rekha Jadhav', mobile: '9876543012', email: 'rekha.j@email.com', city: 'Pune', occupation: 'Accountant', gender: 'Female', address: '44, Aundh, Pune', dateOfBirth: new Date('1987-10-30') },
    { fullName: 'Nitin Gaikwad', mobile: '9876543013', email: 'nitin.g@email.com', city: 'Ahmednagar', occupation: 'Driver', gender: 'Male', address: '67, Nagar Road, Ahmednagar', dateOfBirth: new Date('1979-07-14') },
    { fullName: 'Swati Kulkarni', mobile: '9876543014', email: 'swati.k@email.com', city: 'Pune', occupation: 'Engineer', gender: 'Female', address: '11, Wakad, Pune', dateOfBirth: new Date('1993-11-25') },
    { fullName: 'Prakash Thorat', mobile: '9876543015', email: 'prakash.t@email.com', city: 'Nanded', occupation: 'Farmer', gender: 'Male', address: '5, Shivaji Nagar, Nanded', dateOfBirth: new Date('1976-04-02') },
  ];

  const createdMembers = [];
  const createdAccounts = [];

  for (const md of memberData) {
    const member = await Member.create({
      ...md,
      joiningDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      nomineeDetails: { name: 'Nominee Name', relation: 'Spouse', mobile: '9000000000' },
    });

    // Create member user
    const memberUser = await User.create({
      name: md.fullName,
      email: md.email,
      password: 'Member@123',
      role: 'member',
      memberId: member._id,
      isActive: true,
    });

    member.userId = memberUser._id;
    await member.save();

    // Create savings account with some balance
    const balance = Math.floor(Math.random() * 50000) + 5000;
    const account = await SavingsAccount.create({ memberId: member._id, balance });

    createdMembers.push(member);
    createdAccounts.push(account);

    // Record initial deposit transaction
    await Transaction.create({
      memberId: member._id,
      accountId: account._id,
      type: 'deposit',
      amount: balance,
      balanceBefore: 0,
      balanceAfter: balance,
      paymentMethod: 'cash',
      description: 'Initial deposit / membership fee',
      recordedBy: admin._id,
    });
  }

  console.log(`👥 ${createdMembers.length} members created with savings accounts`);

  // ── Sample Loans ──
  const loanConfigs = [
    { idx: 0, type: 'personal', amount: 100000, rate: 12, tenure: 24, status: 'disbursed', monthsAgo: 6 },
    { idx: 1, type: 'business', amount: 250000, rate: 14, tenure: 36, status: 'disbursed', monthsAgo: 3 },
    { idx: 2, type: 'education', amount: 75000, rate: 8, tenure: 18, status: 'approved', monthsAgo: 1 },
    { idx: 3, type: 'emergency', amount: 30000, rate: 10, tenure: 12, status: 'disbursed', monthsAgo: 2 },
    { idx: 4, type: 'personal', amount: 50000, rate: 12, tenure: 12, status: 'rejected', monthsAgo: 2 },
    { idx: 5, type: 'business', amount: 500000, rate: 14, tenure: 60, status: 'pending', monthsAgo: 0 },
    { idx: 6, type: 'personal', amount: 80000, rate: 12, tenure: 18, status: 'disbursed', monthsAgo: 10 },
    { idx: 7, type: 'emergency', amount: 20000, rate: 10, tenure: 6, status: 'closed', monthsAgo: 12 },
  ];

  for (const lc of loanConfigs) {
    const member = createdMembers[lc.idx];
    const appDate = new Date();
    appDate.setMonth(appDate.getMonth() - lc.monthsAgo);

    const loanDoc = {
      memberId: member._id,
      loanType: lc.type,
      requestedAmount: lc.amount,
      interestRate: lc.rate,
      tenureMonths: lc.tenure,
      purpose: `${lc.type} loan for personal use`,
      applicationDate: appDate,
      status: lc.status,
    };

    if (['approved', 'disbursed', 'closed'].includes(lc.status)) {
      const { emi, totalRepayable, totalInterest } = calculateEMI(lc.amount, lc.rate, lc.tenure);
      loanDoc.approvedAmount = lc.amount;
      loanDoc.emi = emi;
      loanDoc.totalRepayable = totalRepayable;
      loanDoc.totalInterest = totalInterest;
      loanDoc.outstandingBalance = lc.amount;
      loanDoc.approvedBy = admin._id;
      loanDoc.approvedDate = appDate;
    }

    if (['disbursed', 'closed'].includes(lc.status)) {
      loanDoc.status = lc.status;
      loanDoc.disbursedAmount = lc.amount;
      loanDoc.disbursedDate = appDate;
      loanDoc.disbursedBy = staff1._id;
    }

    if (lc.status === 'rejected') {
      loanDoc.remarks = 'Insufficient income proof provided';
      loanDoc.approvedBy = admin._id;
    }

    const loan = await Loan.create(loanDoc);

    // Create disbursement transaction
    if (['disbursed', 'closed'].includes(lc.status)) {
      await Transaction.create({
        memberId: member._id,
        loanId: loan._id,
        type: 'loan_disbursement',
        amount: lc.amount,
        paymentMethod: 'online',
        description: `Loan disbursement - ${loan.loanId}`,
        recordedBy: staff1._id,
      });

      // Generate installments
      const schedule = generateInstallmentSchedule(lc.amount, lc.rate, lc.tenure, appDate);
      const installmentDocs = schedule.map((s) => ({
        loanId: loan._id,
        memberId: member._id,
        ...s,
      }));
      await Installment.insertMany(installmentDocs);

      // Pay some installments (for disbursed loans)
      const paidCount = lc.status === 'closed' ? lc.tenure : lc.monthsAgo;
      const installments = await Installment.find({ loanId: loan._id }).sort({ installmentNumber: 1 }).limit(paidCount);

      let outstanding = lc.amount;
      for (const inst of installments) {
        const txn = await Transaction.create({
          memberId: member._id,
          loanId: loan._id,
          installmentId: inst._id,
          type: 'loan_repayment',
          amount: inst.emiAmount,
          paymentMethod: 'cash',
          description: `EMI #${inst.installmentNumber} for ${loan.loanId}`,
          recordedBy: staff2._id,
        });

        outstanding = Math.max(0, outstanding - inst.principalComponent);

        inst.status = 'paid';
        inst.paidDate = inst.dueDate;
        inst.paidAmount = inst.emiAmount;
        inst.paymentMethod = 'cash';
        inst.transactionId = txn._id;
        inst.recordedBy = staff2._id;
        await inst.save();
      }

      loan.outstandingBalance = outstanding;
      if (lc.status === 'closed') {
        loan.closedDate = new Date();
        loan.outstandingBalance = 0;
      }
      await loan.save();
    }
  }

  console.log('💳 Loan data seeded with installments and repayments');

  // ── Additional deposits and withdrawals ──
  for (let i = 0; i < 10; i++) {
    const member = createdMembers[i];
    const account = createdAccounts[i];
    const depositAmt = Math.floor(Math.random() * 20000) + 5000;

    await Transaction.create({
      memberId: member._id,
      accountId: account._id,
      type: 'deposit',
      amount: depositAmt,
      balanceBefore: account.balance,
      balanceAfter: account.balance + depositAmt,
      paymentMethod: 'cash',
      description: 'Monthly savings deposit',
      recordedBy: staff1._id,
    });

    account.balance += depositAmt;
    await account.save();
  }

  console.log('💰 Additional transactions seeded');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  SEED COMPLETE — Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin   → admin@sahyog.com   / Admin@123');
  console.log('  Staff 1 → staff1@sahyog.com  / Staff@123');
  console.log('  Staff 2 → staff2@sahyog.com  / Staff@123');
  console.log('  Member  → suresh.nair@email.com / Member@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
