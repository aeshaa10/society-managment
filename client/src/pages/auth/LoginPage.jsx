import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      setAuthError('');
      const user = await login(values.email, values.password);
      toast.success(`Welcome back, ${user.name}!`);
      const from = location.state?.from?.pathname;
      if (user.role === 'member') {
        navigate(from || '/member/dashboard', { replace: true });
      } else {
        navigate(from || '/admin/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setAuthError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 h-64 w-64 bg-blue-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 h-96 w-96 bg-indigo-700/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-900 rounded-2xl mb-4 shadow-lg">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Sahyog Co-operative Society</h1>
            <p className="text-sm text-gray-500 mt-1">Management System</p>
          </div>

          {/* Error */}
          {authError && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-base"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">Demo Credentials (Click to fill):</p>
            <div className="space-y-1.5 text-xs text-gray-500 font-mono">
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'admin@sahyog.com');
                  setValue('password', 'Admin@123');
                }}
                className="w-full text-left p-1.5 rounded hover:bg-blue-50 transition-colors flex items-center justify-between"
              >
                <span><strong className="text-blue-900 font-semibold">Admin:</strong> admin@sahyog.com</span>
                <span className="text-[11px] text-gray-400">Admin@123</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'staff1@sahyog.com');
                  setValue('password', 'Staff@123');
                }}
                className="w-full text-left p-1.5 rounded hover:bg-purple-50 transition-colors flex items-center justify-between"
              >
                <span><strong className="text-purple-700 font-semibold">Staff:</strong> staff1@sahyog.com</span>
                <span className="text-[11px] text-gray-400">Staff@123</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'suresh.nair@email.com');
                  setValue('password', 'Member@123');
                }}
                className="w-full text-left p-1.5 rounded hover:bg-emerald-50 transition-colors flex items-center justify-between"
              >
                <span><strong className="text-emerald-700 font-semibold">Member:</strong> suresh.nair@email.com</span>
                <span className="text-[11px] text-gray-400">Member@123</span>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-400 text-center font-sans">
              Note: In credit societies, new members are registered by Admin under "Members → Add Member" (KYC & verification).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
