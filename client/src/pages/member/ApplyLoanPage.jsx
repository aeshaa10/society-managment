import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Calculator,
  Info,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { loanService } from '../../services/services';
import { formatCurrency, calculateEMI } from '../../utils/helpers';

const schema = z.object({
  loanType: z.enum(['personal', 'emergency', 'business', 'education'], {
    required_error: 'Please select a loan type',
  }),
  requestedAmount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(1000, 'Minimum amount is ₹1,000')
    .max(1000000, 'Maximum amount is ₹10,00,000'),
  tenureMonths: z
    .number({ invalid_type_error: 'Tenure must be a number' })
    .int('Tenure must be a whole number')
    .min(1, 'Minimum tenure is 1 month')
    .max(60, 'Maximum tenure is 60 months'),
  purpose: z
    .string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(500, 'Purpose must not exceed 500 characters'),
});

const LOAN_TYPES = [
  { value: 'personal', label: 'Personal Loan', desc: 'For personal expenses & needs' },
  { value: 'emergency', label: 'Emergency Loan', desc: 'For urgent/emergency situations' },
  { value: 'business', label: 'Business Loan', desc: 'For business expansion & working capital' },
  { value: 'education', label: 'Education Loan', desc: 'For educational expenses & fees' },
];

const PREVIEW_RATE = 12; // Default preview rate (actual set by admin)

export default function ApplyLoanPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [emiPreview, setEmiPreview] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      loanType: '',
      requestedAmount: '',
      tenureMonths: '',
      purpose: '',
    },
  });

  const watchedAmount = watch('requestedAmount');
  const watchedTenure = watch('tenureMonths');

  // Live EMI preview
  useEffect(() => {
    const amount = parseFloat(watchedAmount);
    const tenure = parseInt(watchedTenure, 10);
    if (amount >= 1000 && tenure >= 1 && tenure <= 60) {
      const result = calculateEMI(amount, PREVIEW_RATE, tenure);
      setEmiPreview(result);
    } else {
      setEmiPreview(null);
    }
  }, [watchedAmount, watchedTenure]);

  async function onSubmit(data) {
    try {
      setSubmitting(true);
      await loanService.apply(data);
      toast.success('Loan application submitted successfully! We will review it shortly.');
      navigate('/member/loans');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit loan application. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apply for a Loan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to submit your loan application.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Your application will be reviewed by the society management. The final interest rate and 
          approved amount will be determined by the administrator.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Loan Type */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={16} className="text-blue-900" /> Loan Details
          </h2>

          {/* Loan Type Select */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LOAN_TYPES.map((lt) => (
                <label
                  key={lt.value}
                  className="relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-blue-300"
                >
                  <input
                    type="radio"
                    value={lt.value}
                    {...register('loanType')}
                    className="mt-0.5 accent-blue-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{lt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{lt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.loanType && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.loanType.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Requested Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
              <input
                type="number"
                {...register('requestedAmount', { valueAsNumber: true })}
                placeholder="e.g. 50000"
                className="input-field pl-7"
                min={1000}
                max={1000000}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Min: ₹1,000 — Max: ₹10,00,000</p>
            {errors.requestedAmount && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.requestedAmount.message}
              </p>
            )}
          </div>

          {/* Tenure */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tenure (Months) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('tenureMonths', { valueAsNumber: true })}
              placeholder="e.g. 24"
              className="input-field"
              min={1}
              max={60}
            />
            <p className="text-xs text-gray-400 mt-1">Min: 1 month — Max: 60 months</p>
            {errors.tenureMonths && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.tenureMonths.message}
              </p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Purpose / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('purpose')}
              rows={3}
              placeholder="Describe the purpose of your loan application..."
              className="input-field resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Min 10 characters, max 500 characters.</p>
            {errors.purpose && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.purpose.message}
              </p>
            )}
          </div>
        </div>

        {/* EMI Preview */}
        {emiPreview && (
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Calculator size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">EMI Preview</h3>
                  <p className="text-blue-200 text-xs">Based on {PREVIEW_RATE}% p.a. (preview only — actual rate set by admin)</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-blue-200 text-xs mb-0.5">Monthly EMI</p>
                  <p className="text-xl font-bold">{formatCurrency(emiPreview.emi)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs mb-0.5">Total Interest</p>
                  <p className="text-lg font-semibold">{formatCurrency(emiPreview.totalInterest)}</p>
                </div>
                <div>
                  <p className="text-blue-200 text-xs mb-0.5">Total Repayable</p>
                  <p className="text-lg font-semibold">{formatCurrency(emiPreview.totalRepayable)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/member/loans')}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-900 text-white font-semibold text-sm py-3 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
