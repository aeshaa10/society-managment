import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  createStaff: (data) => api.post('/auth/create-staff', data),
  getStaff: () => api.get('/auth/staff'),
  toggleStaffStatus: (id) => api.patch(`/auth/staff/${id}/toggle`),
};

export const memberService = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  toggleStatus: (id) => api.patch(`/members/${id}/status`),
  getStatement: (id, params) => api.get(`/members/${id}/statement`, { params }),
  getHistory: (id, params) => api.get(`/members/${id}/statement`, { params }),
  getMemberStats: () => api.get('/members/stats'),
};

export const savingsService = {
  getAll: (params) => api.get('/savings', { params }),
  getById: (id) => api.get(`/savings/${id}`),
  getByMember: (memberId) => api.get(`/savings/member/${memberId}`),
  create: (data) => api.post('/savings', data),
  deposit: (id, data) => api.post(`/savings/${id}/deposit`, data),
  withdraw: (id, data) => api.post(`/savings/${id}/withdraw`, data),
  getTransactions: (id, params) => api.get(`/savings/${id}/transactions`, { params }),
  getStatement: (id, params) => api.get(`/savings/${id}/transactions`, { params }),
  getStats: () => api.get('/savings/stats'),
};

export const loanService = {
  getAll: (params) => api.get('/loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  getMyLoans: () => api.get('/loans/my'),
  apply: (data) => api.post('/loans', data),
  approve: (id, data) => api.patch(`/loans/${id}/approve`, data),
  reject: (id, data) => api.patch(`/loans/${id}/reject`, data),
  disburse: (id, data) => api.post(`/loans/${id}/disburse`, data),
  calculateEMI: (data) => api.post('/loans/calculate', data),
  getSchedule: (id) => api.get(`/loans/${id}/schedule`),
  getLoanStats: () => api.get('/loans/stats'),
};

export const installmentService = {
  getByLoan: (loanId) => api.get(`/installments/loan/${loanId}`),
  getOverdue: (params) => api.get('/installments/overdue', { params }),
  getUpcoming: (params) => api.get('/installments/upcoming', { params }),
  getStats: () => api.get('/installments/stats'),
  pay: (id, data) => api.post(`/installments/${id}/pay`, data),
};

export const transactionService = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  getMyTransactions: (params) => api.get('/transactions/my', { params }),
  exportCSV: (params) => api.get('/transactions/export', { params, responseType: 'blob' }),
  getStats: () => api.get('/transactions/stats'),
};

export const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getMembers: (params) => api.get('/reports/members', { params }),
  getDeposits: (params) => api.get('/reports/deposits', { params }),
  getLoans: (params) => api.get('/reports/loans', { params }),
  getRepayments: (params) => api.get('/reports/repayments', { params }),
  getOutstanding: (params) => api.get('/reports/outstanding', { params }),
  getOverdue: (params) => api.get('/reports/overdue', { params }),
  getTransactions: (params) => api.get('/reports/transactions', { params }),
  getMonthlySummary: (params) => api.get('/reports/monthly-summary', { params }),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const auditService = {
  getAll: (params) => api.get('/audit', { params }),
};

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
