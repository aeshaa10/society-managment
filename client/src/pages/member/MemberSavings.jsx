import { useEffect, useState } from 'react';
import { PiggyBank, ArrowUpCircle, ArrowDownCircle, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { savingsService } from '../../services/services';
import { formatCurrency, formatDate, getStatusBadge, capitalize } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MemberSavings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.memberId) {
      fetchSavings();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function fetchSavings() {
    try {
      setLoading(true);
      setError(null);
      const accRes = await savingsService.getByMember(user.memberId);
      const acc = accRes.data?.data;
      setAccount(acc);
      if (acc?._id) {
        const stmtRes = await savingsService.getStatement(acc._id);
        setTransactions(stmtRes.data?.data?.transactions || stmtRes.data?.data || []);
      }
    } catch (err) {
      setError('Failed to load savings data. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (val, row) => (
        <span className="text-sm text-gray-700">{formatDate(val || row.createdAt)}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <div className="flex items-center gap-2">
          {val === 'deposit' ? (
            <ArrowUpCircle size={15} className="text-emerald-500" />
          ) : (
            <ArrowDownCircle size={15} className="text-red-400" />
          )}
          <Badge status={val} />
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (val, row) => {
        const isCredit = row.type === 'deposit';
        return (
          <span className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
            {isCredit ? '+' : '-'}{formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      render: (val) => (
        <span className="text-sm text-gray-800 font-medium">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span className="text-sm text-gray-500">{val || '—'}</span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Savings</h1>
        <p className="text-sm text-gray-500 mt-1">Track your savings balance and transaction history.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {!account ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
          <PiggyBank size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No savings account linked to your profile.</p>
          <p className="text-gray-400 text-sm mt-1">Please contact the society office.</p>
        </div>
      ) : (
        <>
          {/* Account Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Balance Card */}
            <div className="sm:col-span-1 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-700 rounded-lg">
                    <PiggyBank size={18} className="text-white" />
                  </div>
                  <p className="text-emerald-100 text-sm font-medium">Current Balance</p>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(account.balance)}</p>
                <p className="text-emerald-200 text-xs mt-2">
                  Min. Balance: {formatCurrency(account.minimumBalance || 0)}
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="sm:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Account Details</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs text-gray-400">Account Number</p>
                  <p className="text-sm font-semibold text-gray-800 font-mono flex items-center gap-1 mt-0.5">
                    <Hash size={12} className="text-gray-400" /> {account.accountNumber || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Account Status</p>
                  <div className="mt-0.5">
                    <Badge status={account.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Account Type</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{capitalize(account.accountType || 'savings')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Member Name</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{account.member?.name || user?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Opening Date</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(account.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Deposits</p>
                  <p className="text-sm font-medium text-emerald-600 mt-0.5">{formatCurrency(account.totalDeposits || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Deposits', value: formatCurrency(account.totalDeposits || 0), color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Total Withdrawals', value: formatCurrency(account.totalWithdrawals || 0), color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
              { label: 'Transactions', value: transactions.length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
              { label: 'Available Balance', value: formatCurrency(Math.max(0, (account.balance || 0) - (account.minimumBalance || 0))), color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Transaction History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpCircle size={18} className="text-blue-900" />
              <h2 className="text-base font-semibold text-gray-900">Transaction History</h2>
            </div>
            <DataTable
              columns={columns}
              data={transactions}
              loading={false}
              emptyMessage="No transactions found for this account."
              pageSize={10}
            />
          </div>
        </>
      )}
    </div>
  );
}
