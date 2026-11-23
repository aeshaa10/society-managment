import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter, ArrowUpCircle, ArrowDownCircle, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { transactionService } from '../../services/services';
import { formatCurrency, formatDate, getStatusBadge, capitalize, exportToCSV } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TXN_TYPES = ['', 'deposit', 'withdrawal', 'loan_disbursement', 'loan_repayment', 'adjustment'];
const PAYMENT_METHODS = ['', 'cash', 'bank_transfer', 'cheque', 'upi', 'online'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const res = await transactionService.getAll({});
      const data = res.data?.transactions || res.data?.data || res.data || [];
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const memberName = t.member?.name || t.memberName || '';
      const txnId = t._id || t.transactionId || '';
      const matchSearch =
        !search ||
        memberName.toLowerCase().includes(search.toLowerCase()) ||
        txnId.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || t.type === typeFilter;
      const matchMethod = !methodFilter || t.paymentMethod === methodFilter;
      const txnDate = new Date(t.date || t.createdAt);
      const matchFrom = !dateFrom || txnDate >= new Date(dateFrom);
      const matchTo = !dateTo || txnDate <= new Date(dateTo + 'T23:59:59');
      return matchSearch && matchType && matchMethod && matchFrom && matchTo;
    });
  }, [transactions, search, typeFilter, methodFilter, dateFrom, dateTo]);

  function handleExportCSV() {
    if (!filtered.length) {
      toast.error('No data to export');
      return;
    }
    const csvData = filtered.map((t) => ({
      Date: formatDate(t.date || t.createdAt),
      TransactionID: t._id || t.transactionId || '',
      MemberName: t.member?.name || t.memberName || '—',
      Type: capitalize(t.type || ''),
      Amount: t.amount,
      PaymentMethod: capitalize(t.paymentMethod || ''),
      RecordedBy: t.recordedBy?.name || t.createdBy?.name || '—',
      Description: t.description || '',
    }));
    exportToCSV(csvData, `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV exported successfully');
  }

  function clearFilters() {
    setSearch('');
    setTypeFilter('');
    setMethodFilter('');
    setDateFrom('');
    setDateTo('');
  }

  const isCredit = (type) => ['deposit', 'loan_repayment'].includes(type);
  const isDebit = (type) => ['withdrawal', 'loan_disbursement'].includes(type);

  const columns = [
    {
      key: 'date',
      label: 'Date',
      width: '110px',
      render: (_, row) => (
        <span className="text-xs text-gray-600">{formatDate(row.date || row.createdAt)}</span>
      ),
    },
    {
      key: '_id',
      label: 'Txn ID',
      width: '140px',
      render: (val) => (
        <span className="font-mono text-xs text-gray-500 truncate block max-w-[130px]" title={val}>
          #{String(val).slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'member',
      label: 'Member Name',
      render: (_, row) => (
        <span className="text-sm font-medium text-gray-800">
          {row.member?.name || row.memberName || '—'}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: '150px',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'amount',
      label: 'Amount',
      width: '130px',
      render: (val, row) => (
        <span
          className={`font-semibold text-sm flex items-center gap-1 ${
            isCredit(row.type)
              ? 'text-emerald-600'
              : isDebit(row.type)
              ? 'text-red-600'
              : 'text-gray-700'
          }`}
        >
          {isCredit(row.type) && <ArrowUpCircle size={13} />}
          {isDebit(row.type) && <ArrowDownCircle size={13} />}
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      width: '110px',
      render: (val) => (
        <span className="text-xs capitalize text-gray-600">{val?.replace(/_/g, ' ') || '—'}</span>
      ),
    },
    {
      key: 'recordedBy',
      label: 'Recorded By',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row.recordedBy?.name || row.createdBy?.name || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '50px',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedTxn(row); }}
          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
          title="View Details"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, t) => {
        if (isCredit(t.type)) acc.credits += t.amount || 0;
        if (isDebit(t.type)) acc.debits += t.amount || 0;
        return acc;
      },
      { credits: 0, debits: 0 }
    );
  }, [filtered]);

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Credits</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totals.credits)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Debits</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totals.debits)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {(search || typeFilter || methodFilter || dateFrom || dateTo) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={12} /> Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search member or Txn ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            {TXN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t ? capitalize(t) : 'All Types'}
              </option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="input"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m ? capitalize(m) : 'All Methods'}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input flex-1 text-xs"
              title="From Date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input flex-1 text-xs"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        emptyMessage="No transactions match your filters"
        pageSize={15}
      />

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title="Transaction Details"
        size="md"
      >
        {selectedTxn && (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div
                className={`flex flex-col items-center gap-1 p-4 rounded-xl ${
                  isCredit(selectedTxn.type) ? 'bg-emerald-50' : isDebit(selectedTxn.type) ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                {isCredit(selectedTxn.type) ? (
                  <ArrowUpCircle size={32} className="text-emerald-600" />
                ) : isDebit(selectedTxn.type) ? (
                  <ArrowDownCircle size={32} className="text-red-600" />
                ) : null}
                <span
                  className={`text-3xl font-bold ${
                    isCredit(selectedTxn.type)
                      ? 'text-emerald-700'
                      : isDebit(selectedTxn.type)
                      ? 'text-red-700'
                      : 'text-gray-800'
                  }`}
                >
                  {formatCurrency(selectedTxn.amount)}
                </span>
                <Badge status={selectedTxn.type} />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500 uppercase">Transaction ID</dt>
                <dd className="font-mono text-gray-800 mt-0.5">
                  #{String(selectedTxn._id || '').slice(-10).toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase">Date</dt>
                <dd className="text-gray-800 mt-0.5">{formatDate(selectedTxn.date || selectedTxn.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase">Member</dt>
                <dd className="text-gray-800 mt-0.5">
                  {selectedTxn.member?.name || selectedTxn.memberName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase">Member ID</dt>
                <dd className="text-gray-800 mt-0.5">
                  {selectedTxn.member?.memberId || selectedTxn.member?._id || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase">Payment Method</dt>
                <dd className="text-gray-800 mt-0.5 capitalize">
                  {selectedTxn.paymentMethod?.replace(/_/g, ' ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase">Reference No.</dt>
                <dd className="text-gray-800 mt-0.5">{selectedTxn.referenceNumber || selectedTxn.reference || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-gray-500 uppercase">Description</dt>
                <dd className="text-gray-800 mt-0.5">{selectedTxn.description || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 uppercase">Recorded By</dt>
                <dd className="text-gray-800 mt-0.5">
                  {selectedTxn.recordedBy?.name || selectedTxn.createdBy?.name || '—'}
                </dd>
              </div>
              {selectedTxn.balanceAfter !== undefined && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Balance After</dt>
                  <dd className="text-gray-800 mt-0.5">{formatCurrency(selectedTxn.balanceAfter)}</dd>
                </div>
              )}
            </dl>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedTxn(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
