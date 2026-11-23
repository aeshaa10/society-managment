import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Calendar,
  Download,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Users,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Printer,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { reportService } from '../../services/services';
import { formatCurrency, formatDate, exportToCSV, capitalize } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const REPORT_TABS = [
  { id: 'summary', label: 'Financial Summary', icon: TrendingUp },
  { id: 'loans', label: 'Loans & Disbursal', icon: CreditCard },
  { id: 'outstanding', label: 'Outstanding Balance', icon: DollarSign },
  { id: 'overdue', label: 'Overdue Installments', icon: AlertTriangle },
  { id: 'transactions', label: 'Transactions Ledger', icon: BarChart3 },
  { id: 'members', label: 'Member Growth', icon: Users },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Report Data
  const [summaryData, setSummaryData] = useState(null);
  const [loanReport, setLoanReport] = useState({ loans: [], summary: [] });
  const [outstandingReport, setOutstandingReport] = useState({ loans: [], totalOutstanding: 0 });
  const [overdueReport, setOverdueReport] = useState({ installments: [], totalOverdue: 0 });
  const [txnReport, setTxnReport] = useState({ transactions: [], totalAmount: 0, byType: {} });
  const [memberReport, setMemberReport] = useState({ members: [], count: 0 });

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  async function fetchReportData(tab) {
    try {
      setLoading(true);
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      if (tab === 'summary') {
        const res = await reportService.getDashboard();
        setSummaryData(res.data?.data || null);
      } else if (tab === 'loans') {
        const res = await reportService.getLoans(params);
        setLoanReport(res.data?.data || { loans: [], summary: [] });
      } else if (tab === 'outstanding') {
        const res = await reportService.getOutstanding(params);
        setOutstandingReport(res.data?.data || { loans: [], totalOutstanding: 0 });
      } else if (tab === 'overdue') {
        const res = await reportService.getOverdue(params);
        setOverdueReport(res.data?.data || { installments: [], totalOverdue: 0 });
      } else if (tab === 'transactions') {
        const rawRes = await reportService.getTransactions(params);
        setTxnReport(rawRes.data?.data || { transactions: [], totalAmount: 0, byType: {} });
      } else if (tab === 'members') {
        const res = await reportService.getMembers(params);
        setMemberReport(res.data?.data || { members: [], count: 0 });
      }
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  function handleApplyFilters(e) {
    e?.preventDefault();
    fetchReportData(activeTab);
  }

  function handleResetFilters() {
    setFromDate('');
    setToDate('');
    setStatusFilter('');
    setTypeFilter('');
    setTimeout(() => {
      fetchReportData(activeTab);
    }, 0);
  }

  // Monthly chart data processing
  const monthlyChartData = useMemo(() => {
    if (!summaryData?.charts) return [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map = {};

    (summaryData.charts.depositChart || []).forEach((d) => {
      const key = `${months[d._id.month - 1] || d._id.month}`;
      map[key] = { name: key, deposits: d.total, loans: 0, repayments: 0 };
    });

    (summaryData.charts.loanChart || []).forEach((l) => {
      const key = `${months[l._id.month - 1] || l._id.month}`;
      map[key] = map[key] || { name: key, deposits: 0, loans: 0, repayments: 0 };
      map[key].loans = l.total;
    });

    (summaryData.charts.repaymentChart || []).forEach((r) => {
      const key = `${months[r._id.month - 1] || r._id.month}`;
      map[key] = map[key] || { name: key, deposits: 0, loans: 0, repayments: 0 };
      map[key].repayments = r.total;
    });

    return Object.values(map);
  }, [summaryData]);

  // CSV Export Handler
  function exportActiveReport() {
    if (activeTab === 'loans' && loanReport.loans.length) {
      const data = loanReport.loans.map((l) => ({
        'Loan ID': l.loanId,
        'Member Name': l.memberId?.fullName || '',
        'Member ID': l.memberId?.memberId || '',
        Type: l.loanType,
        'Requested Amount': l.requestedAmount,
        'Approved Amount': l.approvedAmount || 0,
        Status: l.status,
        Date: formatDate(l.applicationDate),
      }));
      exportToCSV(data, `loans_report_${Date.now()}.csv`);
    } else if (activeTab === 'outstanding' && outstandingReport.loans.length) {
      const data = outstandingReport.loans.map((l) => ({
        'Loan ID': l.loanId,
        'Member Name': l.memberId?.fullName || '',
        Mobile: l.memberId?.mobile || '',
        Type: l.loanType,
        'Disbursed Amount': l.disbursedAmount || 0,
        'Outstanding Balance': l.outstandingBalance || 0,
        DisbursedDate: formatDate(l.disbursedDate),
      }));
      exportToCSV(data, `outstanding_loans_${Date.now()}.csv`);
    } else if (activeTab === 'overdue' && overdueReport.installments.length) {
      const data = overdueReport.installments.map((i) => ({
        'Installment #': i.installmentNumber,
        'Loan ID': i.loanId?.loanId || '',
        'Member Name': i.memberId?.fullName || '',
        Mobile: i.memberId?.mobile || '',
        'EMI Amount': i.emiAmount,
        'Due Date': formatDate(i.dueDate),
        Status: i.status,
      }));
      exportToCSV(data, `overdue_installments_${Date.now()}.csv`);
    } else if (activeTab === 'transactions' && txnReport.transactions.length) {
      const data = txnReport.transactions.map((t) => ({
        'Txn ID': t.transactionId,
        'Member Name': t.memberId?.fullName || '',
        Type: t.type,
        Amount: t.amount,
        Method: t.paymentMethod,
        Date: formatDate(t.createdAt),
      }));
      exportToCSV(data, `transactions_report_${Date.now()}.csv`);
    } else if (activeTab === 'members' && memberReport.members.length) {
      const data = memberReport.members.map((m) => ({
        'Member ID': m.memberId,
        'Full Name': m.fullName,
        Mobile: m.mobile,
        Email: m.email || '',
        City: m.city,
        Occupation: m.occupation || '',
        Status: m.membershipStatus,
        JoiningDate: formatDate(m.joiningDate),
      }));
      exportToCSV(data, `members_report_${Date.now()}.csv`);
    } else {
      toast('No data available to export in current tab');
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time financial summaries, compliance audits, and society operation ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={exportActiveReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2 scrollbar-none">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Bar (for tabs other than summary) */}
      {activeTab !== 'summary' && (
        <form
          onSubmit={handleApplyFilters}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          </div>

          {activeTab === 'loans' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Loan Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="disbursed">Disbursed</option>
                <option value="rejected">Rejected</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Txn Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              >
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="loan_disbursement">Loan Disbursal</option>
                <option value="loan_repayment">Loan Repayment</option>
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-900 text-white font-semibold text-xs py-2 px-3 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter size={13} /> Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-gray-500 hover:text-gray-800 p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              title="Reset Filters"
            >
              <X size={15} />
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* TAB 1: SUMMARY & TRENDS */}
          {activeTab === 'summary' && summaryData && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={DollarSign}
                  label="Total Savings Balance"
                  value={formatCurrency(summaryData.summary?.totalSavings || 0)}
                  sub="Active member savings"
                  color="emerald"
                />
                <StatCard
                  icon={CreditCard}
                  label="Loans Disbursed"
                  value={formatCurrency(summaryData.summary?.totalDisbursed || 0)}
                  sub="Cumulative loan principal"
                  color="navy"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Outstanding Principal"
                  value={formatCurrency(summaryData.summary?.totalOutstanding || 0)}
                  sub="Balance remaining"
                  color="purple"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Overdue Dues"
                  value={summaryData.summary?.overdueCount || 0}
                  sub="Unpaid installments"
                  color="red"
                />
              </div>

              {/* Monthly Trend Chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      6-Month Society Financial Performance
                    </h2>
                    <p className="text-xs text-gray-400">
                      Monthly comparison of savings deposits, loan disbursements, and repayments collected.
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), '']}
                        contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar dataKey="deposits" name="Savings Deposits" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="loans" name="Loan Disbursed" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="repayments" name="EMI Collected" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOANS & DISBURSAL REPORT */}
          {activeTab === 'loans' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Loan Applications & Disbursals ({loanReport.loans.length})
                </h2>
              </div>

              <DataTable
                columns={[
                  { key: 'loanId', label: 'Loan ID', render: (val) => <span className="font-mono text-xs font-bold text-blue-900">{val}</span> },
                  { key: 'memberId', label: 'Member', render: (val) => <span className="font-semibold text-gray-900">{val?.fullName || '—'}</span> },
                  { key: 'loanType', label: 'Type', render: (val) => <span className="capitalize text-xs font-medium">{val}</span> },
                  { key: 'requestedAmount', label: 'Requested', render: (val) => formatCurrency(val) },
                  { key: 'approvedAmount', label: 'Approved', render: (val) => (val ? formatCurrency(val) : '—') },
                  { key: 'status', label: 'Status', render: (val) => <Badge status={val} /> },
                  { key: 'applicationDate', label: 'Applied Date', render: (val) => formatDate(val) },
                ]}
                data={loanReport.loans}
                loading={false}
                pageSize={15}
              />
            </div>
          )}

          {/* TAB 3: OUTSTANDING REPORT */}
          {activeTab === 'outstanding' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-800 font-medium">Total Society Loan Exposure</p>
                  <p className="text-2xl font-bold text-blue-950">
                    {formatCurrency(outstandingReport.totalOutstanding || 0)}
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-white text-blue-900 rounded-full border border-blue-200">
                  {outstandingReport.count || outstandingReport.loans?.length || 0} Active Loans
                </span>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <DataTable
                  columns={[
                    { key: 'loanId', label: 'Loan ID', render: (val) => <span className="font-mono text-xs font-bold">{val}</span> },
                    { key: 'memberId', label: 'Member Name', render: (val) => <span className="font-semibold text-gray-900">{val?.fullName || '—'}</span> },
                    { key: 'loanType', label: 'Loan Type', render: (val) => <span className="capitalize">{val}</span> },
                    { key: 'disbursedAmount', label: 'Disbursed', render: (val) => formatCurrency(val) },
                    {
                      key: 'outstandingBalance',
                      label: 'Outstanding Principal',
                      render: (val) => <span className="font-bold text-blue-900">{formatCurrency(val)}</span>,
                    },
                    { key: 'disbursedDate', label: 'Disbursed Date', render: (val) => formatDate(val) },
                  ]}
                  data={outstandingReport.loans}
                  loading={false}
                  pageSize={15}
                />
              </div>
            </div>
          )}

          {/* TAB 4: OVERDUE REPORT */}
          {activeTab === 'overdue' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-700 font-medium">Total Overdue Installment Amount</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(overdueReport.totalOverdue || 0)}
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-white text-red-700 rounded-full border border-red-200">
                  {overdueReport.count || overdueReport.installments?.length || 0} Defaulted EMIs
                </span>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <DataTable
                  columns={[
                    { key: 'installmentNumber', label: 'Inst #', render: (val) => <span className="font-bold">#{val}</span> },
                    { key: 'loanId', label: 'Loan ID', render: (val) => <span className="font-mono text-xs">{val?.loanId || '—'}</span> },
                    { key: 'memberId', label: 'Member Name', render: (val) => <span className="font-semibold">{val?.fullName || '—'}</span> },
                    { key: 'emiAmount', label: 'EMI Amount Due', render: (val) => <span className="font-bold text-red-600">{formatCurrency(val)}</span> },
                    { key: 'dueDate', label: 'Due Date', render: (val) => <span className="text-xs font-medium text-red-600">{formatDate(val)}</span> },
                    { key: 'status', label: 'Status', render: (val) => <Badge status={val} /> },
                  ]}
                  data={overdueReport.installments}
                  loading={false}
                  pageSize={15}
                />
              </div>
            </div>
          )}

          {/* TAB 5: TRANSACTIONS REPORT */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Financial Transactions ({txnReport.transactions.length})
                </h2>
                <span className="text-xs font-medium text-gray-500">
                  Total Volume: <strong className="text-gray-900">{formatCurrency(txnReport.totalAmount || 0)}</strong>
                </span>
              </div>

              <DataTable
                columns={[
                  { key: 'transactionId', label: 'Txn ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
                  { key: 'memberId', label: 'Member', render: (val) => <span className="font-semibold">{val?.fullName || '—'}</span> },
                  { key: 'type', label: 'Type', render: (val) => <Badge status={val} /> },
                  {
                    key: 'amount',
                    label: 'Amount',
                    render: (val, row) => {
                      const isCredit = ['deposit', 'loan_disbursement'].includes(row.type);
                      return (
                        <span className={`font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(val)}
                        </span>
                      );
                    },
                  },
                  { key: 'paymentMethod', label: 'Method', render: (val) => <span className="capitalize text-xs">{val}</span> },
                  { key: 'createdAt', label: 'Timestamp', render: (val) => formatDate(val) },
                ]}
                data={txnReport.transactions}
                loading={false}
                pageSize={15}
              />
            </div>
          )}

          {/* TAB 6: MEMBER GROWTH REPORT */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Registered Members ({memberReport.members.length})
                </h2>
              </div>

              <DataTable
                columns={[
                  { key: 'memberId', label: 'Member ID', render: (val) => <span className="font-mono text-xs font-bold text-blue-900">{val}</span> },
                  { key: 'fullName', label: 'Full Name', render: (val) => <span className="font-semibold text-gray-900">{val}</span> },
                  { key: 'mobile', label: 'Mobile', render: (val) => <span className="text-xs font-mono">{val}</span> },
                  { key: 'city', label: 'City', render: (val) => <span className="text-xs">{val || '—'}</span> },
                  { key: 'occupation', label: 'Occupation', render: (val) => <span className="text-xs">{val || '—'}</span> },
                  { key: 'membershipStatus', label: 'Status', render: (val) => <Badge status={val} /> },
                  { key: 'joiningDate', label: 'Joining Date', render: (val) => formatDate(val) },
                ]}
                data={memberReport.members}
                loading={false}
                pageSize={15}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
