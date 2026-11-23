import { useState, useEffect } from 'react';
import { memberService } from '../../services/services';
import { formatDate, capitalize } from '../../utils/helpers';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Search, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    memberService.getAll()
      .then(({ data }) => {
        const list = data.data?.members || data.data || [];
        setMembers(list);
        setFiltered(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = members;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.fullName?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        m.mobile?.includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter(m => m.status === statusFilter);
    setFiltered(result);
  }, [search, statusFilter, members]);

  const columns = [
    { key: 'memberId', label: 'Member ID', render: (v) => <span className="font-mono text-xs text-blue-800 font-semibold">{v}</span> },
    { key: 'fullName', label: 'Full Name', render: (v, row) => (
      <Link to={`/admin/members/${row._id}`} className="font-medium text-gray-800 hover:text-blue-700 transition-colors">
        {v}
      </Link>
    )},
    { key: 'mobile', label: 'Mobile' },
    { key: 'gender', label: 'Gender' },
    { key: 'occupation', label: 'Occupation', render: (v) => v || '—' },
    { key: 'joiningDate', label: 'Joined', render: (v) => formatDate(v) },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: '_id', label: 'Actions', render: (_, row) => (
      <Link
        to={`/admin/members/${row._id}`}
        className="text-xs text-blue-700 hover:underline font-medium"
      >
        View →
      </Link>
    )},
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Members</h2>
          <p className="text-sm text-gray-500">{members.length} total registered members</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'staff') && (
          <Link to="/admin/members/add" className="btn-primary flex items-center gap-2">
            <UserPlus size={16} />
            Add Member
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9 py-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-input py-2 w-36"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No members found"
      />
    </div>
  );
}
