import { useState, useEffect } from 'react';
import { loanService } from '../../services/services';
import { formatCurrency, formatDate, capitalize } from '../../utils/helpers';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setStatusFilter(statusParam);
  }, []);

  useEffect(() => {
    loanService.getAll()
      .then(({ data }) => {
        const list = data.data?.loans || data.data || [];
        setLoans(list);
        setFiltered(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = loans;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.loanId?.toLowerCase().includes(q) ||
        l.memberId?.fullName?.toLowerCase().includes(q) ||
        l.memberId?.memberId?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter(l => l.status === statusFilter);
    if (typeFilter) result = result.filter(l => l.loanType === typeFilter);
    setFiltered(result);
  }, [search, statusFilter, typeFilter, loans]);

  const columns = [
    { key: 'loanId', label: 'Loan ID', render: v => <span className="font-mono text-xs text-purple-800 font-semibold">{v}</span> },
    { key: 'memberId', label: 'Member', render: v => (
      <div>
        <p className="font-medium text-sm">{v?.fullName || '—'}</p>
        <p className="text-xs text-gray-400 font-mono">{v?.memberId}</p>
      </div>
    )},
    { key: 'loanType', label: 'Type', render: v => <span className="capitalize text-sm">{v}</span> },
    { key: 'requestedAmount', label: 'Requested', render: v => formatCurrency(v) },
    { key: 'approvedAmount', label: 'Approved', render: v => v ? <span className="text-emerald-700 font-semibold">{formatCurrency(v)}</span> : '—' },
    { key: 'interestRate', label: 'Rate', render: v => `${v}% p.a.` },
    { key: 'tenureMonths', label: 'Tenure', render: v => `${v} mo.` },
    { key: 'applicationDate', label: 'Applied', render: v => formatDate(v) },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <Link to={`/admin/loans/${row._id}`} className="text-xs text-blue-700 hover:underline font-medium">
        View →
      </Link>
    )},
  ];

  const statuses = ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Loan Management</h2>
          <p className="text-sm text-gray-500">{filtered.length} of {loans.length} loans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by loan ID or member name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 py-2"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input py-2 w-40">
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-input py-2 w-36">
          <option value="">All Types</option>
          <option value="personal">Personal</option>
          <option value="emergency">Emergency</option>
          <option value="business">Business</option>
          <option value="education">Education</option>
        </select>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No loans found" />
    </div>
  );
}
