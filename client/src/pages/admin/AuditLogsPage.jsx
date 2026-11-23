import { useState, useEffect, useMemo } from 'react';
import { Filter, Shield, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditService } from '../../services/services';
import { formatDate, capitalize } from '../../utils/helpers';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ACTION_BADGE_MAP = {
  LOAN_APPROVED:   'bg-emerald-100 text-emerald-800',
  LOAN_REJECTED:   'bg-red-100 text-red-800',
  LOAN_APPLIED:    'bg-yellow-100 text-yellow-800',
  LOAN_DISBURSED:  'bg-purple-100 text-purple-800',
  LOAN_CLOSED:     'bg-gray-100 text-gray-700',
  USER_LOGIN:      'bg-blue-100 text-blue-800',
  USER_LOGOUT:     'bg-slate-100 text-slate-700',
  USER_CREATED:    'bg-cyan-100 text-cyan-800',
  USER_UPDATED:    'bg-indigo-100 text-indigo-800',
  MEMBER_CREATED:  'bg-teal-100 text-teal-800',
  MEMBER_UPDATED:  'bg-teal-100 text-teal-800',
  SAVINGS_DEPOSIT: 'bg-emerald-100 text-emerald-800',
  SAVINGS_WITHDRAW:'bg-orange-100 text-orange-800',
  SETTINGS_UPDATED:'bg-amber-100 text-amber-800',
  INSTALLMENT_PAID:'bg-emerald-100 text-emerald-800',
  PASSWORD_CHANGED:'bg-red-100 text-red-800',
};

const ACTION_TYPES = [
  '',
  'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_APPLIED', 'LOAN_DISBURSED', 'LOAN_CLOSED',
  'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED',
  'MEMBER_CREATED', 'MEMBER_UPDATED',
  'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAW',
  'SETTINGS_UPDATED', 'INSTALLMENT_PAID', 'PASSWORD_CHANGED',
];

function ActionBadge({ action }) {
  const cls = ACTION_BADGE_MAP[action] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {action?.replace(/_/g, ' ') || '—'}
    </span>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await auditService.getAll({});
      const data = res.data?.logs || res.data?.data || res.data || [];
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const actor = log.performedBy?.name || log.user?.name || '';
      const target = log.target || log.resource || '';
      const desc = log.description || log.details || '';
      const matchSearch =
        !search ||
        actor.toLowerCase().includes(search.toLowerCase()) ||
        target.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase());
      const matchAction = !actionFilter || log.action === actionFilter;
      const logDate = new Date(log.createdAt || log.timestamp);
      const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
      const matchTo = !dateTo || logDate <= new Date(dateTo + 'T23:59:59');
      return matchSearch && matchAction && matchFrom && matchTo;
    });
  }, [logs, search, actionFilter, dateFrom, dateTo]);

  function clearFilters() {
    setSearch('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
  }

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      width: '155px',
      render: (_, row) => {
        const d = new Date(row.createdAt || row.timestamp);
        return (
          <span className="text-xs text-gray-600 whitespace-nowrap">
            {d.toLocaleDateString('en-IN')} {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      key: 'performedBy',
      label: 'Performed By',
      render: (_, row) => (
        <span className="text-sm font-medium text-gray-800">
          {row.performedBy?.name || row.user?.name || '—'}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      width: '90px',
      render: (_, row) => (
        <span className="text-xs capitalize text-gray-600">
          {row.performedBy?.role || row.user?.role || row.role || '—'}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      width: '180px',
      render: (val) => <ActionBadge action={val} />,
    },
    {
      key: 'description',
      label: 'Description',
      render: (_, row) => (
        <span className="text-sm text-gray-600 leading-snug">
          {row.description || row.details || '—'}
        </span>
      ),
    },
    {
      key: 'target',
      label: 'Target',
      width: '140px',
      render: (_, row) => (
        <span className="text-xs text-gray-500 font-mono">
          {row.target || row.resource || row.resourceId || '—'}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-900 rounded-xl">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Read-only system activity records &mdash; {filtered.length} entries
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['LOAN_APPROVED', 'LOAN_REJECTED', 'USER_LOGIN', 'SETTINGS_UPDATED'].map((action) => {
          const count = filtered.filter((l) => l.action === action).length;
          const cls = ACTION_BADGE_MAP[action] || 'bg-gray-100 text-gray-700';
          return (
            <div key={action} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                {action.replace(/_/g, ' ')}
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {(search || actionFilter || dateFrom || dateTo) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={12} /> Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search user, target or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input"
          >
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a ? a.replace(/_/g, ' ') : 'All Actions'}
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

      {/* Table — Read Only */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={false}
        emptyMessage="No audit log entries match your filters"
        pageSize={20}
      />

      <p className="text-center text-xs text-gray-400 pb-4">
        Audit logs are read-only. No modifications are permitted.
      </p>
    </div>
  );
}
