import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Search,
  Filter,
  Check,
  ArrowRight,
  TrendingUp,
  Receipt,
  Clock,
} from 'lucide-react';
import { installmentService, loanService } from '../../services/services';
import { formatCurrency, formatDate, capitalize } from '../../utils/helpers';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function RepaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overdue'); // 'overdue' | 'upcoming' | 'lookup'
  const [stats, setStats] = useState(null);

  // Overdue & Upcoming lists
  const [overdueList, setOverdueList] = useState([]);
  const [upcomingList, setUpcomingList] = useState([]);

  // Search / Lookup by Loan ID
  const [searchLoanId, setSearchLoanId] = useState('');
  const [loanSearchLoading, setLoanSearchLoading] = useState(false);
  const [lookedUpLoan, setLookedUpLoan] = useState(null);
  const [loanInstallments, setLoanInstallments] = useState([]);

  // Filter text
  const [searchQuery, setSearchQuery] = useState('');

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [payMethod, setPayMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [statsRes, overdueRes, upcomingRes] = await Promise.all([
        installmentService.getStats().catch(() => ({ data: { data: null } })),
        installmentService.getOverdue({ limit: 50 }).catch(() => ({ data: { data: [] } })),
        installmentService.getUpcoming().catch(() => ({ data: { data: [] } })),
      ]);

      setStats(statsRes.data?.data || null);

      const overdueData =
        overdueRes.data?.data?.installments ||
        overdueRes.data?.data ||
        (Array.isArray(overdueRes.data) ? overdueRes.data : []);
      setOverdueList(overdueData);

      const upcomingData =
        upcomingRes.data?.data?.installments ||
        upcomingRes.data?.data ||
        (Array.isArray(upcomingRes.data) ? upcomingRes.data : []);
      setUpcomingList(upcomingData);
    } catch {
      toast.error('Failed to load repayment records');
    } finally {
      setLoading(false);
    }
  }

  async function handleLookupLoan(e) {
    e?.preventDefault();
    if (!searchLoanId.trim()) return;

    try {
      setLoanSearchLoading(true);
      setLookedUpLoan(null);
      setLoanInstallments([]);

      // Loan ID could be either MongoDB _id or string loanId (LN-YYYY-NNN)
      const res = await installmentService.getByLoan(searchLoanId.trim());
      const data = res.data?.data;
      if (data) {
        setLookedUpLoan(data.loan);
        setLoanInstallments(data.installments || []);
      } else {
        toast.error('No loan found with that ID');
      }
    } catch (err) {
      toast.error('Loan not found or error retrieving schedule');
    } finally {
      setLoanSearchLoading(false);
    }
  }

  function openPayModal(installment) {
    setSelectedInstallment(installment);
    setPaidAmount(installment.emiAmount);
    setPayMethod('cash');
    setReferenceNumber('');
    setPayModalOpen(true);
  }

  function closePayModal() {
    setPayModalOpen(false);
    setSelectedInstallment(null);
  }

  async function submitPayment(e) {
    e.preventDefault();
    if (!selectedInstallment) return;

    try {
      setSubmittingPayment(true);
      await installmentService.pay(selectedInstallment._id, {
        paymentMethod: payMethod,
        referenceNumber,
        paidAmount: parseFloat(paidAmount) || selectedInstallment.emiAmount,
      });

      toast.success(
        `EMI #${selectedInstallment.installmentNumber} recorded successfully!`
      );
      closePayModal();

      // Refresh data
      fetchInitialData();
      if (lookedUpLoan) {
        handleLookupLoan();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment recording failed';
      toast.error(msg);
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Filtered overdue
  const filteredOverdue = useMemo(() => {
    return overdueList.filter((item) => {
      const query = searchQuery.toLowerCase();
      const memberName = item.memberId?.fullName?.toLowerCase() || '';
      const memberCode = item.memberId?.memberId?.toLowerCase() || '';
      const loanCode = item.loanId?.loanId?.toLowerCase() || '';
      return (
        memberName.includes(query) ||
        memberCode.includes(query) ||
        loanCode.includes(query)
      );
    });
  }, [overdueList, searchQuery]);

  // Filtered upcoming
  const filteredUpcoming = useMemo(() => {
    return upcomingList.filter((item) => {
      const query = searchQuery.toLowerCase();
      const memberName = item.memberId?.fullName?.toLowerCase() || '';
      const memberCode = item.memberId?.memberId?.toLowerCase() || '';
      const loanCode = item.loanId?.loanId?.toLowerCase() || '';
      return (
        memberName.includes(query) ||
        memberCode.includes(query) ||
        loanCode.includes(query)
      );
    });
  }, [upcomingList, searchQuery]);

  const overdueColumns = [
    {
      key: 'installmentNumber',
      label: 'Inst #',
      render: (val) => <span className="font-bold text-gray-800">#{val}</span>,
    },
    {
      key: 'memberId',
      label: 'Member',
      render: (val) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {val?.fullName || '—'}
          </p>
          <p className="text-xs text-gray-400 font-mono">
            {val?.memberId || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'loanId',
      label: 'Loan',
      render: (val) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
            {val?.loanId || '—'}
          </span>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {val?.loanType || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val) => (
        <div>
          <p className="text-sm font-semibold text-red-600">{formatDate(val)}</p>
          <span className="text-[11px] font-medium text-red-500">Overdue</span>
        </div>
      ),
    },
    {
      key: 'emiAmount',
      label: 'EMI Due',
      render: (val) => (
        <span className="text-sm font-bold text-gray-900">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <button
          onClick={() => openPayModal(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
        >
          <Check size={14} /> Record Payment
        </button>
      ),
    },
  ];

  const upcomingColumns = [
    {
      key: 'installmentNumber',
      label: 'Inst #',
      render: (val) => <span className="font-bold text-gray-800">#{val}</span>,
    },
    {
      key: 'memberId',
      label: 'Member',
      render: (val) => (
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {val?.fullName || '—'}
          </p>
          <p className="text-xs text-gray-400 font-mono">
            {val?.memberId || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'loanId',
      label: 'Loan',
      render: (val) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
            {val?.loanId || '—'}
          </span>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {val?.loanType || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{formatDate(val)}</p>
          <span className="text-[11px] text-gray-400">Within 30 days</span>
        </div>
      ),
    },
    {
      key: 'emiAmount',
      label: 'EMI Amount',
      render: (val) => (
        <span className="text-sm font-bold text-gray-900">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <button
          onClick={() => openPayModal(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
        >
          <Receipt size={14} /> Pay EMI
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loan Repayments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor overdue installments, track upcoming monthly collections, and record member loan repayments.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Collected"
          value={formatCurrency(stats?.totalCollected || 0)}
          sub="All-time loan collections"
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Installments"
          value={stats?.totalOverdue ?? overdueList.length}
          sub="Requires immediate follow-up"
          color="red"
        />
        <StatCard
          icon={Calendar}
          label="Pending Installments"
          value={stats?.totalPending ?? upcomingList.length}
          sub="Upcoming & scheduled"
          color="navy"
        />
        <StatCard
          icon={CheckCircle2}
          label="Paid Installments"
          value={stats?.totalPaid ?? 0}
          sub="Successfully settled"
          color="purple"
        />
      </div>

      {/* Tabs and Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle size={15} />
              Overdue ({overdueList.length})
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'bg-blue-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar size={15} />
              Upcoming 30 Days ({upcomingList.length})
            </button>

            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'lookup'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Search size={15} />
              Loan Lookup / Direct Pay
            </button>
          </div>

          {/* Quick Search */}
          {activeTab !== 'lookup' && (
            <div className="relative w-full md:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Filter by member or loan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Overdue Tab */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Overdue Installments ({filteredOverdue.length})
            </h2>
          </div>

          <DataTable
            columns={overdueColumns}
            data={filteredOverdue}
            loading={false}
            emptyMessage="No overdue installments found. Great job!"
            pageSize={15}
          />
        </div>
      )}

      {/* Tab 2: Upcoming Tab */}
      {activeTab === 'upcoming' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-blue-900" />
            <h2 className="text-base font-semibold text-gray-900">
              Upcoming Installments in Next 30 Days ({filteredUpcoming.length})
            </h2>
          </div>

          <DataTable
            columns={upcomingColumns}
            data={filteredUpcoming}
            loading={false}
            emptyMessage="No installments due in the next 30 days."
            pageSize={15}
          />
        </div>
      )}

      {/* Tab 3: Loan Lookup Tab */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Search Loan Schedule & Repayments
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Enter a Loan ID (e.g. MongoDB ID or Loan Code) to see all installments and record payments for that specific account.
            </p>

            <form onSubmit={handleLookupLoan} className="flex gap-3 max-w-lg">
              <input
                type="text"
                placeholder="Enter Loan ID (e.g. 673... or LN-2024-001)"
                value={searchLoanId}
                onChange={(e) => setSearchLoanId(e.target.value)}
                className="flex-1 text-sm px-3.5 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
              <button
                type="submit"
                disabled={loanSearchLoading}
                className="bg-blue-900 text-white font-semibold text-xs px-5 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loanSearchLoading ? 'Searching...' : 'Find Loan'}
              </button>
            </form>
          </div>

          {lookedUpLoan && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Loan {lookedUpLoan.loanId || lookedUpLoan._id}
                  </h3>
                  <p className="text-xs text-gray-400 capitalize">
                    {lookedUpLoan.loanType} Loan • Status: {lookedUpLoan.status}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-gray-400">Approved Amount</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(lookedUpLoan.approvedAmount || lookedUpLoan.requestedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Outstanding Balance</p>
                    <p className="text-sm font-bold text-blue-900">
                      {formatCurrency(lookedUpLoan.outstandingBalance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Installment Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['#', 'Due Date', 'EMI Amount', 'Principal', 'Interest', 'Status', 'Paid Date', 'Action'].map(
                        (h) => (
                          <th key={h} className="table-th">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loanInstallments.map((inst) => {
                      const isOverdue = inst.status === 'overdue';
                      const isPaid = inst.status === 'paid';
                      return (
                        <tr
                          key={inst._id}
                          className={isOverdue ? 'bg-red-50/50' : isPaid ? 'bg-emerald-50/30' : ''}
                        >
                          <td className="table-td font-semibold">#{inst.installmentNumber}</td>
                          <td className="table-td">{formatDate(inst.dueDate)}</td>
                          <td className="table-td font-semibold">{formatCurrency(inst.emiAmount)}</td>
                          <td className="table-td">{formatCurrency(inst.principalComponent)}</td>
                          <td className="table-td text-blue-700">{formatCurrency(inst.interestComponent)}</td>
                          <td className="table-td">
                            <Badge status={inst.status} />
                          </td>
                          <td className="table-td text-xs text-gray-500">
                            {inst.paidDate ? formatDate(inst.paidDate) : '—'}
                          </td>
                          <td className="table-td">
                            {!isPaid && (
                              <button
                                onClick={() => openPayModal(inst)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded transition-colors"
                              >
                                Record Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Recording Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={closePayModal}
        title="Record Installment Repayment"
        size="md"
      >
        {selectedInstallment && (
          <form onSubmit={submitPayment} className="space-y-4 pt-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Installment Number</span>
                <span className="font-bold text-gray-800">
                  #{selectedInstallment.installmentNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium text-gray-800">
                  {formatDate(selectedInstallment.dueDate)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Scheduled EMI</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(selectedInstallment.emiAmount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount Paid (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              >
                <option value="cash">Cash</option>
                <option value="online">Online / UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reference / Transaction / Cheque No. (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UTR12345678 or CHQ-9901"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={closePayModal}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {submittingPayment ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Confirm Payment
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
