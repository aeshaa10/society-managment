import { useEffect, useState, useMemo } from 'react';
import { Receipt, Filter, X } from 'lucide-react';
import { transactionService } from '../../services/services';
import { formatCurrency, formatDate, capitalize } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CREDIT_TYPES = ['deposit', 'loan_disbursement'];
const DEBIT_TYPES = ['withdrawal', 'loan_repayment'];
const ALL_TYPES = [...CREDIT_TYPES, ...DEBIT_TYPES, 'adjustment'];

export default function MemberTransactions() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      setError(null);
      const res = await transactionService.getMyTransactions();
      const data = res.data?.data?.transactions || res.data?.data || [];
      setTransactions(data);
    } catch {
      setError('Failed to load transactions. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Client-side filtering
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date || tx.createdAt);
      if (fromDate && txDate < new Date(fromDate)) return false;
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59);
        if (txDate > to) return false;
      }
      if (typeFilter && tx.type !== typeFilter) return false;
      return true;
    });
  }, [transactions, fromDate, toDate, typeFilter]);

  function clearFilters() {
    setFromDate('');
    setToDate('');
    setTypeFilter('');
  }

  const hasFilters = fromDate || toDate || typeFilter;

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (val, row) => (
        <div>
          <p className="text-sm text-gray-800">{formatDate(val || row.createdAt)}</p>
          <p className="text-xs text-gray-400">
            {new Date(val || row.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (val, row) => (
        <span className="text-xs font-mono text-gray-500">
          {val || row._id?.slice(-8)?.toUpperCase() || '—'}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (val, row) => {
        const isCredit = CREDIT_TYPES.includes(row.type);
        return (
          <span className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
            {isCredit ? '+' : '-'}{formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (val) => (
        <span className="text-sm text-gray-600 capitalize">{val ? capitalize(val) : '—'}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span className="text-sm text-gray-500 max-w-[180px] truncate block">{val || '—'}</span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-sm text-gray-500 mt-1">View all your financial transactions.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Transactions',
            value: filtered.length,
            color: 'text-blue-800',
            bg: 'bg-blue-50 border-blue-100',
          },
          {
            label: 'Total Credits',
            value: formatCurrency(
              filtered.filter((t) => CREDIT_TYPES.includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0)
            ),
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-100',
          },
          {
            label: 'Total Debits',
            value: formatCurrency(
              filtered.filter((t) => DEBIT_TYPES.includes(t.type)).reduce((s, t) => s + (t.amount || 0), 0)
            ),
            color: 'text-red-500',
            bg: 'bg-red-50 border-red-100',
          },
          {
            label: 'Net Flow',
            value: formatCurrency(
              filtered.reduce((s, t) => {
                return CREDIT_TYPES.includes(t.type) ? s + (t.amount || 0) : s - (t.amount || 0);
              }, 0)
            ),
            color: 'text-purple-700',
            bg: 'bg-purple-50 border-purple-100',
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Filter Transactions</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
            >
              <X size={12} /> Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">All Types</option>
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>{capitalize(t)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={18} className="text-blue-900" />
          <h2 className="text-base font-semibold text-gray-900">
            Transactions{' '}
            <span className="text-sm font-normal text-gray-400">({filtered.length} records)</span>
          </h2>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          loading={false}
          emptyMessage={
            hasFilters
              ? 'No transactions match the selected filters.'
              : 'No transactions found.'
          }
          pageSize={15}
        />
      </div>
    </div>
  );
}
