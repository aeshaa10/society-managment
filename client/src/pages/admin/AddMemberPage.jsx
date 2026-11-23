import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { memberService } from '../../services/services';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, ChevronLeft } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().min(5, 'Address is too short'),
  city: z.string().min(2, 'City is required'),
  occupation: z.string().optional(),
  joiningDate: z.string().optional(),
  'nomineeDetails.name': z.string().min(1, 'Nominee name is required'),
  'nomineeDetails.relation': z.string().min(1, 'Relation is required'),
  'nomineeDetails.mobile': z.string().optional(),
});

export default function AddMemberPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { joiningDate: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        nomineeDetails: {
          name: values['nomineeDetails.name'],
          relation: values['nomineeDetails.relation'],
          mobile: values['nomineeDetails.mobile'],
        },
      };
      delete payload['nomineeDetails.name'];
      delete payload['nomineeDetails.relation'];
      delete payload['nomineeDetails.mobile'];

      const { data } = await memberService.create(payload);
      if (data.success) {
        toast.success(`Member registered! ID: ${data.data.member?.memberId || ''}`);
        navigate('/admin/members');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register member');
    }
  };

  const Field = ({ name, label, required, children }) => (
    <div>
      <label className="form-label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {errors[name] && <p className="form-error">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Register New Member</h2>
          <p className="text-sm text-gray-500">Member ID will be auto-generated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field name="fullName" label="Full Name" required>
              <input {...register('fullName')} className={`form-input ${errors.fullName ? 'form-input-error' : ''}`} placeholder="Rajesh Kumar Sharma" />
            </Field>
            <Field name="dateOfBirth" label="Date of Birth" required>
              <input {...register('dateOfBirth')} type="date" className={`form-input ${errors.dateOfBirth ? 'form-input-error' : ''}`} />
            </Field>
            <Field name="gender" label="Gender" required>
              <select {...register('gender')} className={`form-input ${errors.gender ? 'form-input-error' : ''}`}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field name="mobile" label="Mobile Number" required>
              <input {...register('mobile')} className={`form-input ${errors.mobile ? 'form-input-error' : ''}`} placeholder="9876543210" maxLength={10} />
            </Field>
            <Field name="email" label="Email Address">
              <input {...register('email')} type="email" className={`form-input ${errors.email ? 'form-input-error' : ''}`} placeholder="rajesh@email.com" />
            </Field>
            <Field name="occupation" label="Occupation">
              <input {...register('occupation')} className="form-input" placeholder="Farmer, Teacher, etc." />
            </Field>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">Address Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field name="address" label="Full Address" required>
                <textarea {...register('address')} rows={2} className={`form-input ${errors.address ? 'form-input-error' : ''}`} placeholder="Plot 12, Nehru Nagar, Behind Bus Stand..." />
              </Field>
            </div>
            <Field name="city" label="City" required>
              <input {...register('city')} className={`form-input ${errors.city ? 'form-input-error' : ''}`} placeholder="Pune" />
            </Field>
            <Field name="joiningDate" label="Joining Date">
              <input {...register('joiningDate')} type="date" className="form-input" />
            </Field>
          </div>
        </div>

        {/* Nominee */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">Nominee Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field name="nomineeDetails.name" label="Nominee Name" required>
              <input {...register('nomineeDetails.name')} className={`form-input ${errors['nomineeDetails.name'] ? 'form-input-error' : ''}`} placeholder="Sunita Sharma" />
            </Field>
            <Field name="nomineeDetails.relation" label="Relation" required>
              <input {...register('nomineeDetails.relation')} className={`form-input ${errors['nomineeDetails.relation'] ? 'form-input-error' : ''}`} placeholder="Wife, Son, etc." />
            </Field>
            <Field name="nomineeDetails.mobile" label="Nominee Mobile">
              <input {...register('nomineeDetails.mobile')} className="form-input" placeholder="9876543210" maxLength={10} />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
            <UserPlus size={16} />
            {isSubmitting ? 'Registering...' : 'Register Member'}
          </button>
        </div>
      </form>
    </div>
  );
}
