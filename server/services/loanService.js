/**
 * EMI Calculation Service
 * Uses reducing-balance (flat EMI) formula.
 *
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * Where:
 *   P = Principal
 *   r = monthly interest rate = annualRate / 12 / 100
 *   n = tenure in months
 */

/**
 * Calculate EMI
 * @param {number} principal - Loan principal
 * @param {number} annualRate - Annual interest rate (%)
 * @param {number} tenureMonths - Number of months
 * @returns {{ emi, totalRepayable, totalInterest }}
 */
const calculateEMI = (principal, annualRate, tenureMonths) => {
  if (annualRate === 0) {
    // Zero-interest loan: equal principal split
    const emi = Math.ceil(principal / tenureMonths);
    return {
      emi,
      totalRepayable: emi * tenureMonths,
      totalInterest: 0,
    };
  }

  const r = annualRate / 12 / 100;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalRepayable = emi * n;
  const totalInterest = totalRepayable - principal;

  return {
    emi: Math.round(emi * 100) / 100,
    totalRepayable: Math.round(totalRepayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
  };
};

/**
 * Generate a full installment schedule (reducing balance)
 * @param {number} principal
 * @param {number} annualRate
 * @param {number} tenureMonths
 * @param {Date} startDate - First EMI due date
 * @returns {Array} Array of installment objects
 */
const generateInstallmentSchedule = (principal, annualRate, tenureMonths, startDate) => {
  const { emi } = calculateEMI(principal, annualRate, tenureMonths);
  const r = annualRate / 12 / 100;
  const schedule = [];
  let outstanding = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const interestComponent = annualRate === 0 ? 0 : Math.round(outstanding * r * 100) / 100;
    const principalComponent = Math.round((emi - interestComponent) * 100) / 100;

    // Last installment adjustment to avoid rounding drift
    const adjustedPrincipal = i === tenureMonths ? outstanding : principalComponent;
    const adjustedEmi = i === tenureMonths ? outstanding + interestComponent : emi;

    outstanding = Math.max(0, Math.round((outstanding - adjustedPrincipal) * 100) / 100);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      emiAmount: Math.round(adjustedEmi * 100) / 100,
      principalComponent: adjustedPrincipal,
      interestComponent,
      outstandingPrincipal: outstanding,
    });
  }

  return schedule;
};

module.exports = { calculateEMI, generateInstallmentSchedule };
