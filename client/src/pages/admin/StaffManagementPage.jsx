import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Users, Power, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/services';
import { formatDate, capitalize } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['staff', 'admin'], { required_error: 'Select a role' }),
});

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null); // { id, name, active }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(staffSchema) });

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      const res = await authService.getStaff();
      const data = res.data?.staff || res.data?.data || res.data || [];
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }

  async function onCreateStaff(values) {
    try {
      setCreating(true);
      await authService.createStaff(values);
      toast.success(`Staff member "${values.name}" created successfully`);
      setAddModalOpen(false);
      reset();
      fetchStaff();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create staff member');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(member) {
    try {
      await authService.toggleStaffStatus(member._id);
      const wasActive = member.isActive ?? member.status === 'active';
      toast.success(
        `${member.name} has been ${wasActive ? 'deactivated' : 'activated'}`
      );
      setStaff((prev) =>
        prev.map((s) =>
          s._id === member._id
            ? { ...s, isActive: !wasActive, status: wasActive ? 'inactive' : 'active' }
            : s
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update staff status');
    } finally {
      setToggleTarget(null);
    }
  }

  const activeCount = staff.filter((s) => s.isActive || s.status === 'active').length;
  const adminCount = staff.filter((s) => s.role === 'admin').length;

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {(val || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{val}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      width: '100px',
      render: (val) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
            val === 'admin'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      render: (_, row) => {
        const isActive = row.isActive ?? row.status === 'active';
        return <Badge status={isActive ? 'active' : 'inactive'} />;
      },
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      width: '120px',
      render: (_, row) => (
        <span className="text-xs text-gray-500">
          {row.lastLogin ? formatDate(row.lastLogin) : 'Never'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      width: '110px',
      render: (val) => <span className="text-xs text-gray-500">{formatDate(val)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (_, row) => {
        const isActive = row.isActive ?? row.status === 'active';
        return (
          <button
            onClick={() => setToggleTarget(row)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={isActive ? 'Deactivate' : 'Activate'}
          >
            <Power size={12} />
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        );
      },
    },
  ];

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff accounts and permissions</p>
        </div>
        <button
          onClick={() => { reset(); setAddModalOpen(true); }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <UserPlus size={16} />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Staff" value={staff.length} color="navy" />
        <StatCard icon={Users} label="Active" value={activeCount} color="emerald" />
        <StatCard icon={Users} label="Admins" value={adminCount} color="purple" />
      </div>

      {/* Staff Table */}
      <DataTable
        columns={columns}
        data={staff}
        loading={false}
        emptyMessage="No staff members found. Click 'Add Staff' to create one."
        pageSize={10}
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); reset(); }}
        title="Add New Staff Member"
        size="md"
      >
        <form onSubmit={handleSubmit(onCreateStaff)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              {...register('name')}
              className="input w-full"
              placeholder="e.g. Rajesh Kumar"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className="input w-full"
              placeholder="staff@society.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="input w-full pr-10"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="label">Role</label>
            <select {...register('role')} className="input w-full">
              <option value="">Select role...</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setAddModalOpen(false); reset(); }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <UserPlus size={15} />
              {creating ? 'Creating...' : 'Create Staff'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => handleToggleStatus(toggleTarget)}
        title={
          toggleTarget
            ? (toggleTarget.isActive ?? toggleTarget.status === 'active')
              ? 'Deactivate Staff Member'
              : 'Activate Staff Member'
            : ''
        }
        message={
          toggleTarget
            ? `Are you sure you want to ${
                (toggleTarget.isActive ?? toggleTarget.status === 'active')
                  ? 'deactivate'
                  : 'activate'
              } ${toggleTarget.name}? ${
                (toggleTarget.isActive ?? toggleTarget.status === 'active')
                  ? 'They will lose access to the system.'
                  : 'They will regain access to the system.'
              }`
            : ''
        }
        confirmLabel={
          toggleTarget
            ? (toggleTarget.isActive ?? toggleTarget.status === 'active')
              ? 'Yes, Deactivate'
              : 'Yes, Activate'
            : 'Confirm'
        }
        danger={toggleTarget ? (toggleTarget.isActive ?? toggleTarget.status === 'active') : false}
      />
    </div>
  );
}
