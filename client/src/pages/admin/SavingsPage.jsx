import { useState, useEffect } from 'react';
import { savingsService } from '../../services/services';
import { formatCurrency, formatDate } from '../../utils/helpers';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { Link } from 'react-router-dom';
import { Search, PiggyBank } from 'lucide-react';

export default function SavingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    savingsService.getAll()
      .then(({ data }) => {
        const list = data.data?.accounts || data.data || [];
        setAccounts(list);
        setFiltered(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(accounts); return; }
    const q = search.toLowerCase();
    setFiltered(accounts.filter(a =>
      a.accountNumber?.toLowerCase().includes(q) ||
      a.memberId?.fullName?.toLowerCase().includes(q) ||
      a.memberId?.memberId?.toLowerCase().includes(q)
    ));
  }, [search, accounts]);

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const columns = [
    { key: 'accountNumber', label: 'Account No.', render: v => <span className="font-mono text-xs text-blue-800 font-semibold">{v}</span> },
    { key: 'memberId', label: 'Member', render: (v) => (
      <div>
        <p className="font-medium text-sm text-gray-800">{v?.fullName || '—'}</p>
        <p className="text-xs text-gray-400 font-mono">{v?.memberId}</p>
      </div>
    )},
    { key: 'balance', label: 'Balance', render: v => <span className="font-semibold text-emerald-700">{formatCurrency(v)}</span> },
    { key: 'minimumBalance', label: 'Min Balance', render: v => formatCurrency(v) },
    { key: 'openedDate', label: 'Opened', render: v => formatDate(v) },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
    { key: '_id', label: 'Actions', render: (v) => (
      <Link to={`/admin/savings/${v}`} className="text-xs text-blue-700 hover:underline font-medium">
        Manage →
      </Link>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Savings & Deposits</h2>
          <p className="text-sm text-gray-500">{accounts.length} accounts • Total: <strong className="text-emerald-600">{formatCurrency(totalBalance)}</strong></p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by account number or member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 py-2"
          />
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <PiggyBank size={22} className="text-emerald-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Savings</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <PiggyBank size={22} className="text-blue-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Accounts</p>
            <p className="text-xl font-bold text-gray-900">{accounts.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <PiggyBank size={22} className="text-purple-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Accounts</p>
            <p className="text-xl font-bold text-gray-900">{accounts.filter(a => a.status === 'active').length}</p>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No savings accounts found" />
    </div>
  );
}
