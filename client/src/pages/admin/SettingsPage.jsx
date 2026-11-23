import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Save, Building2, Percent, Calendar, Phone, Mail, Hash, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/services';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const schema = z.object({
  societyName: z.string().min(2, 'Society name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(7, 'Valid phone required'),
  email: z.string().email('Valid email required'),
  defaultInterestRate: z.coerce.number().min(0).max(100),
  minimumSavingsBalance: z.coerce.number().min(0),
  maxLoanTenureMonths: z.coerce.number().int().min(1).max(360),
  financialYear: z.string().min(1, 'Financial year is required'),
});

function FieldGroup({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 uppercase tracking-wide">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loanTypes, setLoanTypes] = useState([]);
  const [rawSettings, setRawSettings] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await settingsService.get();
      const data = res.data?.settings || res.data?.data || res.data || {};
      setRawSettings(data);
      setLoanTypes(data.loanTypes || []);
      reset({
        societyName: data.societyName || '',
        registrationNumber: data.registrationNumber || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        defaultInterestRate: data.defaultInterestRate ?? 12,
        minimumSavingsBalance: data.minimumSavingsBalance ?? 500,
        maxLoanTenureMonths: data.maxLoanTenureMonths ?? 60,
        financialYear: data.financialYear || '',
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values) {
    try {
      setSaving(true);
      await settingsService.update({ ...values, loanTypes });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleLoanTypeChange(index, field, value) {
    setLoanTypes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-900 rounded-xl">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Society Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure your society details and financial parameters</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Society Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={17} className="text-blue-900" />
            <h2 className="text-base font-semibold text-gray-900">Society Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FieldGroup icon={Building2} label="Society Name">
                <input
                  {...register('societyName')}
                  className="input w-full"
                  placeholder="e.g. Sunrise Cooperative Society"
                />
                {errors.societyName && (
                  <p className="text-xs text-red-500 mt-1">{errors.societyName.message}</p>
                )}
              </FieldGroup>
            </div>
            <FieldGroup icon={Hash} label="Registration Number">
              <input
                {...register('registrationNumber')}
                className="input w-full"
                placeholder="e.g. CS/MH/2024/00123"
              />
              {errors.registrationNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.registrationNumber.message}</p>
              )}
            </FieldGroup>
            <FieldGroup icon={Calendar} label="Financial Year">
              <input
                {...register('financialYear')}
                className="input w-full"
                placeholder="e.g. 2024-25"
              />
              {errors.financialYear && (
                <p className="text-xs text-red-500 mt-1">{errors.financialYear.message}</p>
              )}
            </FieldGroup>
            <div className="md:col-span-2">
              <FieldGroup icon={Building2} label="Address">
                <textarea
                  {...register('address')}
                  className="input w-full resize-none"
                  rows={2}
                  placeholder="Full society address"
                />
                {errors.address && (
                  <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
                )}
              </FieldGroup>
            </div>
            <FieldGroup icon={Phone} label="Phone">
              <input
                {...register('phone')}
                className="input w-full"
                placeholder="+91 98765 43210"
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </FieldGroup>
            <FieldGroup icon={Mail} label="Email">
              <input
                {...register('email')}
                type="email"
                className="input w-full"
                placeholder="society@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </FieldGroup>
          </div>
        </div>

        {/* Financial Parameters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Percent size={17} className="text-emerald-600" />
            <h2 className="text-base font-semibold text-gray-900">Financial Parameters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FieldGroup icon={Percent} label="Default Interest Rate (% p.a.)">
              <input
                {...register('defaultInterestRate')}
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="input w-full"
                placeholder="12.00"
              />
              {errors.defaultInterestRate && (
                <p className="text-xs text-red-500 mt-1">{errors.defaultInterestRate.message}</p>
              )}
            </FieldGroup>
            <FieldGroup icon={DollarSign} label="Minimum Savings Balance (₹)">
              <input
                {...register('minimumSavingsBalance')}
                type="number"
                min="0"
                className="input w-full"
                placeholder="500"
              />
              {errors.minimumSavingsBalance && (
                <p className="text-xs text-red-500 mt-1">{errors.minimumSavingsBalance.message}</p>
              )}
            </FieldGroup>
            <FieldGroup icon={Calendar} label="Max Loan Tenure (Months)">
              <input
                {...register('maxLoanTenureMonths')}
                type="number"
                min="1"
                max="360"
                className="input w-full"
                placeholder="60"
              />
              {errors.maxLoanTenureMonths && (
                <p className="text-xs text-red-500 mt-1">{errors.maxLoanTenureMonths.message}</p>
              )}
            </FieldGroup>
          </div>
        </div>

        {/* Loan Types */}
        {loanTypes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign size={17} className="text-purple-600" />
              <h2 className="text-base font-semibold text-gray-900">Loan Type Configuration</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-th text-left">Loan Type</th>
                    <th className="table-th text-left">Max Amount (₹)</th>
                    <th className="table-th text-left">Interest Rate (% p.a.)</th>
                    <th className="table-th text-left">Max Tenure (Months)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loanTypes.map((lt, idx) => (
                    <tr key={idx}>
                      <td className="table-td">
                        <input
                          value={lt.name || ''}
                          onChange={(e) => handleLoanTypeChange(idx, 'name', e.target.value)}
                          className="input w-full text-sm"
                          placeholder="Loan type name"
                        />
                      </td>
                      <td className="table-td">
                        <input
                          type="number"
                          value={lt.maxAmount ?? ''}
                          onChange={(e) => handleLoanTypeChange(idx, 'maxAmount', Number(e.target.value))}
                          className="input w-full text-sm"
                          placeholder="500000"
                        />
                      </td>
                      <td className="table-td">
                        <input
                          type="number"
                          step="0.01"
                          value={lt.defaultInterestRate ?? ''}
                          onChange={(e) =>
                            handleLoanTypeChange(idx, 'defaultInterestRate', Number(e.target.value))
                          }
                          className="input w-full text-sm"
                          placeholder="12.00"
                        />
                      </td>
                      <td className="table-td">
                        <input
                          type="number"
                          value={lt.maxTenureMonths ?? ''}
                          onChange={(e) =>
                            handleLoanTypeChange(idx, 'maxTenureMonths', Number(e.target.value))
                          }
                          className="input w-full text-sm"
                          placeholder="60"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={fetchSettings}
            className="btn-secondary"
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
