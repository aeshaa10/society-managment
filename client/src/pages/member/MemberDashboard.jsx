import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PiggyBank,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { memberService, loanService, savingsService, transactionService } from '../../services/services';
import { formatCurrency, formatDate, getStatusBadge, capitalize } from '../../utils/helpers';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savings, setSavings] = useState(null);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const [savingsRes, loansRes, txRes] = await Promise.all([
        user.memberId ? savingsService.getByMember(user.memberId) : Promise.resolve({ data: { data: null } }),
        loanService.getMyLoans(),
        transactionService.getMyTransactions({ limit: 5 }),
      ]);
      setSavings(savingsRes.data?.data || null);
      setLoans(loansRes.data?.data || []);
      setTransactions(txRes.data?.data?.transactions || txRes.data?.data || []);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Derived stats
  const activeLoans = loans.filter((l) => l.status === 'disbursed');
  const overdueInstallments = loans.reduce((acc, loan) => {
    const overdue = (loan.overdueCount) || 0;
    return acc + overdue;
  }, 0);
  const totalRepaid = loans.reduce((acc, loan) => acc + (loan.totalRepaid || 0), 0);

  // Active loan with soonest EMI
  const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-0 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-2xl font-bold mb-1">
            {user?.name || 'Member'}
          </h1>
          <p className="text-blue-300 text-sm">
            Member ID: <span className="font-semibold text-white">{user?.memberId || '—'}</span>
          </p>
          {error && (
            <p className="mt-2 text-red-300 text-sm">{error}</p>
          )}
        </div>
        <div className="relative z-10 mt-4 flex gap-3 flex-wrap">
          <Link
            to="/member/loans/apply"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Apply for a Loan <ArrowRight size={15} />
          </Link>
          <Link
            to="/member/savings"
            className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            View Savings <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={PiggyBank}
          label="Savings Balance"
          value={formatCurrency(savings?.balance ?? 0)}
          sub={savings ? `A/C: ${savings.accountNumber}` : 'No account'}
          color="emerald"
        />
        <StatCard
          icon={CreditCard}
          label="Active Loans"
          value={activeLoans.length}
          sub={activeLoans.length === 1 ? '1 loan disbursed' : `${activeLoans.length} loans disbursed`}
          color="navy"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Installments"
          value={overdueInstallments}
          sub={overdueInstallments > 0 ? 'Action required' : 'All clear'}
          color={overdueInstallments > 0 ? 'red' : 'emerald'}
        />
        <StatCard
          icon={CheckCircle}
          label="Total Repaid"
          value={formatCurrency(totalRepaid)}
          sub="Across all loans"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-blue-900" />
              <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <Link
              to="/member/transactions"
              className="text-xs text-blue-700 font-medium hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No transactions yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.slice(0, 5).map((tx) => {
                const isCredit = ['deposit', 'loan_disbursement'].includes(tx.type);
                return (
                  <div key={tx._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        <TrendingUp size={15} className={isCredit ? 'text-emerald-600' : 'text-red-500 rotate-180'} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{capitalize(tx.type)}</p>
                        <p className="text-xs text-gray-400">{formatDate(tx.date || tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <Badge status={tx.type} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Loan Summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <CreditCard size={18} className="text-blue-900" />
            <h2 className="text-base font-semibold text-gray-900">Active Loan</h2>
          </div>
          {!activeLoan ? (
            <div className="p-6 text-center">
              <div className="mb-4 mx-auto h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center">
                <CreditCard size={22} className="text-blue-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">No active loan found.</p>
              <Link
                to="/member/loans/apply"
                className="inline-flex items-center gap-1.5 bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Apply Now <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Type</span>
                <Badge status={activeLoan.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Loan Type</p>
                <p className="text-sm font-semibold text-gray-800">{capitalize(activeLoan.loanType)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Outstanding Balance</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(activeLoan.outstandingBalance ?? activeLoan.approvedAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Monthly EMI</p>
                <p className="text-sm font-semibold text-gray-800">{formatCurrency(activeLoan.emiAmount)}</p>
              </div>
              {activeLoan.nextEmiDate && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <Calendar size={14} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Next EMI Due</p>
                    <p className="text-xs text-amber-800 font-semibold">{formatDate(activeLoan.nextEmiDate)}</p>
                  </div>
                </div>
              )}
              <Link
                to="/member/loans"
                className="flex items-center justify-center gap-1.5 w-full border border-blue-200 text-blue-800 text-sm font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Schedule <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
