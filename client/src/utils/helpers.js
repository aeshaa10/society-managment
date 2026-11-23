/**
 * Format amount in Indian currency style: ₹1,25,000
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to "15 Nov 2024" using Intl.DateTimeFormat
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Format date to DD/MM/YYYY (legacy alias)
 */
export function formatDateShort(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date to DD MMM YYYY (e.g. 15 Jan 2024) — alias for formatDate
 */
export function formatDateLong(dateString) {
  return formatDate(dateString);
}

/**
 * Calculate EMI using reducing balance formula
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEMI(principal, annualRate, tenureMonths) {
  if (annualRate === 0) {
    return { emi: principal / tenureMonths, totalRepayable: principal, totalInterest: 0 };
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
}

/**
 * Get status badge config (color classes)
 */
export function getStatusBadge(status) {
  const map = {
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    disbursed: 'bg-purple-100 text-purple-800',
    closed: 'bg-gray-100 text-gray-700',
    paid: 'bg-emerald-100 text-emerald-800',
    overdue: 'bg-red-100 text-red-800',
    waived: 'bg-gray-100 text-gray-600',
    frozen: 'bg-blue-100 text-blue-800',
    deposit: 'bg-emerald-100 text-emerald-800',
    withdrawal: 'bg-red-100 text-red-800',
    loan_disbursement: 'bg-purple-100 text-purple-800',
    loan_repayment: 'bg-blue-100 text-blue-800',
    adjustment: 'bg-orange-100 text-orange-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate string to given length
 */
export function truncate(str, len = 30) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/**
 * Export array of objects as CSV
 */
export function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(','),
    ...data.map((row) => keys.map((k) => `"${row[k] ?? ''}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
