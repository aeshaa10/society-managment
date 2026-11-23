import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { memberService, authService } from '../../services/services';
import { formatDate, capitalize } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function MemberProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState(null);
  const [savingsAccount, setSavingsAccount] = useState(null);
  const [loans, setLoans] = useState([]);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    try {
      setLoading(true);
      if (user?.memberId) {
        const res = await memberService.getById(user.memberId);
        const data = res.data?.data;
        if (data) {
          setMemberData(data.member);
          setSavingsAccount(data.savingsAccount);
          setLoans(data.loans || []);
        }
      } else {
        const meRes = await authService.getMe();
        if (meRes.data?.data?.memberData) {
          setMemberData(meRes.data.data.memberData);
        }
      }
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(formData) {
    try {
      setChangingPassword(true);
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Password changed successfully!');
      reset();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Please check your current password.';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <LoadingSpinner fullscreen />;

  const initials = memberData?.fullName
    ? memberData.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : 'MB';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-10 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-extrabold text-white shadow-inner flex-shrink-0">
            {initials}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {memberData?.fullName || user?.name || 'Member Profile'}
              </h1>
              <div className="flex justify-center sm:justify-start">
                <Badge status={memberData?.membershipStatus || 'active'} />
              </div>
            </div>

            <p className="text-blue-200 text-sm font-mono flex items-center justify-center sm:justify-start gap-1">
              Member ID: <span className="text-white font-semibold">{memberData?.memberId || user?.memberId || '—'}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-blue-200">
              <span className="flex items-center gap-1">
                <Mail size={14} className="text-blue-300" />
                {memberData?.email || user?.email || 'No email registered'}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={14} className="text-blue-300" />
                {memberData?.mobile || 'No mobile registered'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-blue-300" />
                Joined: {formatDate(memberData?.joiningDate || memberData?.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <User size={18} className="text-blue-900" />
              <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">Full Legal Name</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{memberData?.fullName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Date of Birth</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {memberData?.dateOfBirth ? formatDate(memberData.dateOfBirth) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Gender</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{capitalize(memberData?.gender) || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Occupation</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5 flex items-center gap-1">
                  <Briefcase size={14} className="text-gray-400" />
                  {memberData?.occupation || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <MapPin size={18} className="text-blue-900" />
              <h2 className="text-base font-semibold text-gray-900">Contact & Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">Mobile Phone</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{memberData?.mobile || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Email Address</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{memberData?.email || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 font-medium">Residential Address</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{memberData?.address || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">City</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{memberData?.city || '—'}</p>
              </div>
            </div>
          </div>

          {/* Nominee Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Users size={18} className="text-blue-900" />
              <h2 className="text-base font-semibold text-gray-900">Nominee Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">Nominee Name</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {memberData?.nomineeDetails?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Relationship</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {capitalize(memberData?.nomineeDetails?.relation) || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Nominee Contact</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {memberData?.nomineeDetails?.mobile || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password Change */}
        <div className="space-y-6">
          {/* Account Summary Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Building size={18} className="text-blue-900" />
              <h2 className="text-base font-semibold text-gray-900">Society Account</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Savings A/C</span>
                <span className="text-xs font-mono font-bold text-gray-800">
                  {savingsAccount?.accountNumber || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">A/C Status</span>
                <Badge status={savingsAccount?.status || 'active'} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Total Loans</span>
                <span className="text-xs font-bold text-gray-800">{loans.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 rounded-lg">
                <span className="text-xs font-medium flex items-center gap-1">
                  <CheckCircle2 size={13} /> KYC Verified
                </span>
                <span className="text-xs font-semibold">Active Member</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <KeyRound size={18} className="text-blue-900" />
              <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
            </div>

            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword')}
                    placeholder="••••••••"
                    className="w-full text-sm px-3 py-2 pr-9 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    placeholder="Min 6 characters"
                    className="w-full text-sm px-3 py-2 pr-9 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Repeat new password"
                    className="w-full text-sm px-3 py-2 pr-9 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full mt-2 bg-blue-900 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {changingPassword ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Shield size={15} /> Update Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
