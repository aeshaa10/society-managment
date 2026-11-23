import { useState, useEffect } from 'react';
import { reportService } from '../../services/services';
import { formatCurrency, formatDate } from '../../utils/helpers';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  Users, PiggyBank, CreditCard, TrendingUp,
  TrendingDown, AlertCircle, Clock, CheckCircle,
  ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getDashboard()
      .then(({ data }) => { if (data.success) setStats(data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div className="text-center py-16 text-gray-400">Could not load dashboard</div>;

  const {
    totalMembers, activeMembers, totalSavingsBalance,
    totalLoansCount, totalLoansDisbursed, outstandingBalance,
    totalRepayments, pendingLoans, recentTransactions,
    recentMembers, monthlyData, loanStatusBreakdown
  } = stats;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={totalMembers}
          sub={`${activeMembers} active`}
          color="navy"
        />
        <StatCard
          icon={PiggyBank}
          label="Total Savings"
          value={formatCurrency(totalSavingsBalance)}
          color="emerald"
        />
        <StatCard
          icon={CreditCard}
          label="Loans Disbursed"
          value={formatCurrency(totalLoansDisbursed)}
          sub={`${totalLoansCount} total loans`}
          color="purple"
        />
        <StatCard
          icon={TrendingDown}
          label="Outstanding Balance"
          value={formatCurrency(outstandingBalance)}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Repayments Collected"
          value={formatCurrency(totalRepayments)}
          color="cyan"
        />
        <StatCard
          icon={Clock}
          label="Pending Approvals"
          value={pendingLoans}
          sub="loan applications"
          color="red"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="deposits" fill="#1e3a8a" radius={[3, 3, 0, 0]} name="Deposits" />
              <Bar dataKey="repayments" fill="#10b981" radius={[3, 3, 0, 0]} name="Repayments" />
              <Bar dataKey="disbursements" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Disbursements" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Loan status pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Loan Status Breakdown</h3>
          {loanStatusBreakdown && loanStatusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={loanStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="status"
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {loanStatusBreakdown.map((entry, index) => (
                    <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">No loan data yet</div>
          )}
        </div>
      </div>

      {/* Bottom row: recent members + transactions + pending loans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending loan approvals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Pending Loan Applications</h3>
            <Link to="/admin/loans?status=pending" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {stats.pendingLoanList && stats.pendingLoanList.length > 0 ? (
            <div className="space-y-3">
              {stats.pendingLoanList.slice(0, 5).map((loan) => (
                <Link
                  to={`/admin/loans/${loan._id}`}
                  key={loan._id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{loan.memberId?.fullName || 'Member'}</p>
                    <p className="text-xs text-gray-500 capitalize">{loan.loanType} loan • {formatDate(loan.applicationDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(loan.requestedAmount)}</p>
                    <Badge status={loan.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CheckCircle size={32} className="mb-2 text-emerald-400" />
              <p className="text-sm">No pending applications!</p>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Recent Transactions</h3>
            <Link to="/admin/transactions" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.slice(0, 6).map((txn) => (
                <div key={txn._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{txn.memberId?.fullName || '—'}</p>
                    <p className="text-xs text-gray-400">{txn.transactionId} • {formatDate(txn.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${txn.type === 'deposit' || txn.type === 'loan_repayment' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {txn.type === 'deposit' || txn.type === 'loan_repayment' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </p>
                    <Badge status={txn.type} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <AlertCircle size={32} className="mb-2" />
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent registrations */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Recent Member Registrations</h3>
          <Link to="/admin/members" className="text-xs text-blue-700 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {recentMembers && recentMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Member ID</th>
                  <th className="table-th">Name</th>
                  <th className="table-th">Mobile</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentMembers.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50/60">
                    <td className="table-td font-mono text-xs">{m.memberId}</td>
                    <td className="table-td font-medium">{m.fullName}</td>
                    <td className="table-td">{m.mobile}</td>
                    <td className="table-td">{formatDate(m.joiningDate)}</td>
                    <td className="table-td"><Badge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No members registered yet</p>
        )}
      </div>
    </div>
  );
}
