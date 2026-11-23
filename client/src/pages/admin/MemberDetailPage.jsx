import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { memberService, savingsService } from '../../services/services';
import { formatDate, formatCurrency } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Edit, ToggleLeft, ToggleRight,
  PiggyBank, CreditCard, FileText
} from 'lucide-react';

const editSchema = z.object({
  fullName: z.string().min(2),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  email: z.string().email().or(z.literal('')).optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  occupation: z.string().optional(),
});

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [account, setAccount] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    Promise.all([
      memberService.getById(id),
      memberService.getHistory(id).catch(() => ({ data: { data: null } })),
    ]).then(([memberRes, histRes]) => {
      const m = memberRes.data.data?.member || memberRes.data.data;
      setMember(m);
      setHistory(histRes.data.data);
      reset({
        fullName: m.fullName,
        mobile: m.mobile,
        email: m.email || '',
        address: m.address,
        city: m.city,
        occupation: m.occupation || '',
      });
      // Fetch savings account
      savingsService.getByMember(m._id)
        .then(r => setAccount(r.data.data?.account || r.data.data))
        .catch(() => {});
    }).finally(() => setLoading(false));
  }, [id]);

  const handleEdit = async (values) => {
    try {
      const { data } = await memberService.update(id, values);
      setMember(prev => ({ ...prev, ...values }));
      toast.success('Member updated successfully');
      setEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleToggle = async () => {
    try {
      const { data } = await memberService.toggleStatus(id);
      setMember(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }));
      toast.success(`Member ${member.status === 'active' ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!member) return <div className="text-center py-16 text-gray-400">Member not found</div>;

  const Info = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{member.fullName}</h2>
            <p className="text-sm text-gray-500 font-mono">{member.memberId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={member.status} />
          <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Edit size={15} /> Edit
          </button>
          <button
            onClick={() => setConfirmToggle(true)}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
              member.status === 'active'
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            {member.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {member.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Personal details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">Personal Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Info label="Full Name" value={member.fullName} />
              <Info label="Date of Birth" value={formatDate(member.dateOfBirth)} />
              <Info label="Gender" value={member.gender} />
              <Info label="Mobile" value={member.mobile} />
              <Info label="Email" value={member.email} />
              <Info label="Occupation" value={member.occupation} />
              <Info label="Address" value={member.address} />
              <Info label="City" value={member.city} />
              <Info label="Joined" value={formatDate(member.joiningDate)} />
            </div>
          </div>

          {member.nomineeDetails && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 border-b pb-2">Nominee Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <Info label="Name" value={member.nomineeDetails.name} />
                <Info label="Relation" value={member.nomineeDetails.relation} />
                <Info label="Mobile" value={member.nomineeDetails.mobile} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: account & quick stats */}
        <div className="space-y-4">
          {account && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank size={18} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-700">Savings Account</h3>
              </div>
              <p className="text-xs text-gray-400 font-mono">{account.accountNumber}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(account.balance)}</p>
              <Badge status={account.status} />
              <Link to={`/admin/savings/${account._id}`} className="mt-3 block text-xs text-blue-700 hover:underline">
                View account details →
              </Link>
            </div>
          )}

          {history && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText size={16} /> Financial Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Deposits</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(history.totalDeposits || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Withdrawals</span>
                  <span className="font-semibold text-red-500">{formatCurrency(history.totalWithdrawals || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Loans</span>
                  <span className="font-semibold">{history.activeLoans || 0}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Outstanding</span>
                  <span className="font-bold text-amber-600">{formatCurrency(history.outstandingBalance || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Member Details">
        <form onSubmit={handleSubmit(handleEdit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['fullName', 'Full Name', 'text'],
              ['mobile', 'Mobile', 'tel'],
              ['email', 'Email', 'email'],
              ['occupation', 'Occupation', 'text'],
              ['city', 'City', 'text'],
            ].map(([name, label, type]) => (
              <div key={name}>
                <label className="form-label">{label}</label>
                <input {...register(name)} type={type} className={`form-input ${errors[name] ? 'form-input-error' : ''}`} />
                {errors[name] && <p className="form-error">{errors[name].message}</p>}
              </div>
            ))}
            <div className="col-span-2">
              <label className="form-label">Address</label>
              <textarea {...register('address')} rows={2} className={`form-input ${errors.address ? 'form-input-error' : ''}`} />
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmToggle}
        onClose={() => setConfirmToggle(false)}
        onConfirm={handleToggle}
        title={member.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
        message={`Are you sure you want to ${member.status === 'active' ? 'deactivate' : 'activate'} ${member.fullName}?`}
        confirmLabel={member.status === 'active' ? 'Deactivate' : 'Activate'}
        danger={member.status === 'active'}
      />
    </div>
  );
}
