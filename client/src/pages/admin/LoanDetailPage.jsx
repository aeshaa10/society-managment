import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loanService, installmentService } from '../../services/services';
import { formatCurrency, formatDate, calculateEMI, capitalize } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ChevronLeft, CheckCircle, XCircle, Banknote } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [disburseConfirm, setDisburseConfirm] = useState(false);

  // Form state
  const [approvedAmount, setApprovedAmount] = useState('');
  const [approvedRate, setApprovedRate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [disbursedMethod, setDisbursedMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  const fetchLoan = () => {
    return Promise.all([
      loanService.getById(id),
      installmentService.getByLoan(id).catch(() => ({ data: { data: [] } })),
    ]).then(([lRes, iRes]) => {
      setLoan(lRes.data.data?.loan || lRes.data.data);
      setInstallments(iRes.data.data?.installments || iRes.data.data || []);
    });
  };

  useEffect(() => {
    fetchLoan().catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!approvedAmount || !approvedRate) { toast.error('Fill all fields'); return; }
    setSubmitting(true);
    try {
      await loanService.approve(id, { approvedAmount: Number(approvedAmount), interestRate: Number(approvedRate) });
      toast.success('Loan approved successfully');
      setApproveModal(false);
      await fetchLoan();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!remarks) { toast.error('Please add rejection remarks'); return; }
    setSubmitting(true);
    try {
      await loanService.reject(id, { remarks });
      toast.success('Loan rejected');
      setRejectModal(false);
      await fetchLoan();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally { setSubmitting(false); }
  };

  const handleDisburse = async () => {
    setSubmitting(true);
    try {
      await loanService.disburse(id, { paymentMethod: disbursedMethod });
      toast.success('Loan disbursed and installment schedule generated!');
      setDisburseConfirm(false);
      await fetchLoan();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Disbursement failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!loan) return <div className="text-center py-16 text-gray-400">Loan not found</div>;

  const emi = loan.approvedAmount
    ? calculateEMI(loan.approvedAmount, loan.interestRate, loan.tenureMonths)
    : null;

  const installmentColumns = [
    { key: 'installmentNumber', label: '#', render: v => `EMI ${v}` },
    { key: 'dueDate', label: 'Due Date', render: v => formatDate(v) },
    { key: 'emiAmount', label: 'EMI', render: v => formatCurrency(v) },
    { key: 'principalComponent', label: 'Principal', render: v => formatCurrency(v) },
    { key: 'interestComponent', label: 'Interest', render: v => formatCurrency(v) },
    { key: 'outstandingPrincipal', label: 'Balance After', render: v => formatCurrency(v) },
    { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
    { key: 'paidDate', label: 'Paid On', render: v => formatDate(v) },
  ];

  const Info = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{loan.loanId}</h2>
            <p className="text-sm text-gray-500">
              {loan.memberId?.fullName} • Applied {formatDate(loan.applicationDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge status={loan.status} />

          {isAdmin && loan.status === 'pending' && (
            <>
              <button onClick={() => { setApproveModal(true); setApprovedAmount(loan.requestedAmount); setApprovedRate(loan.interestRate); }} className="btn-success flex items-center gap-2 text-sm">
                <CheckCircle size={15} /> Approve
              </button>
              <button onClick={() => setRejectModal(true)} className="btn-danger flex items-center gap-2 text-sm">
                <XCircle size={15} /> Reject
              </button>
            </>
          )}

          {isAdmin && loan.status === 'approved' && (
            <button onClick={() => setDisburseConfirm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Banknote size={15} /> Disburse Loan
            </button>
          )}
        </div>
      </div>

      {/* Loan details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-4">Loan Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Info label="Loan Type" value={capitalize(loan.loanType)} />
              <Info label="Requested Amount" value={formatCurrency(loan.requestedAmount)} />
              <Info label="Approved Amount" value={loan.approvedAmount ? formatCurrency(loan.approvedAmount) : '—'} />
              <Info label="Interest Rate" value={`${loan.interestRate}% p.a.`} />
              <Info label="Tenure" value={`${loan.tenureMonths} months`} />
              <Info label="Purpose" value={loan.purpose} />
              {loan.approvedBy && <Info label="Approved By" value={loan.approvedBy?.name} />}
              {loan.disbursedDate && <Info label="Disbursed Date" value={formatDate(loan.disbursedDate)} />}
              {loan.remarks && <Info label="Remarks" value={loan.remarks} />}
            </div>
          </div>

          {/* Installment schedule */}
          {installments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Repayment Schedule</h3>
              <DataTable columns={installmentColumns} data={installments} emptyMessage="No schedule yet" />
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          {emi && (
            <div className="card p-5 bg-blue-950 text-white">
              <h3 className="text-sm font-semibold opacity-80 mb-3">Loan Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs opacity-70">Monthly EMI</span>
                  <span className="font-bold">{formatCurrency(emi.emi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs opacity-70">Total Repayable</span>
                  <span className="font-semibold">{formatCurrency(emi.totalRepayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs opacity-70">Total Interest</span>
                  <span className="font-semibold text-amber-300">{formatCurrency(emi.totalInterest)}</span>
                </div>
                <div className="border-t border-white/20 pt-2 flex justify-between">
                  <span className="text-xs opacity-70">Outstanding</span>
                  <span className="font-bold">{formatCurrency(loan.outstandingBalance || loan.approvedAmount || 0)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Member Info</h3>
            <Info label="Name" value={loan.memberId?.fullName} />
            <div className="mt-2">
              <Info label="Member ID" value={loan.memberId?.memberId} />
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Approve Loan Application" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Approved Amount (₹) *</label>
            <input type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Interest Rate (% p.a.) *</label>
            <input type="number" value={approvedRate} onChange={e => setApprovedRate(e.target.value)} className="form-input" step="0.5" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setApproveModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleApprove} disabled={submitting} className="btn-success flex-1">
              {submitting ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Loan Application" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Rejection Reason *</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} className="form-input" placeholder="Please provide reason for rejection..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleReject} disabled={submitting} className="btn-danger flex-1">
              {submitting ? 'Rejecting...' : 'Reject Loan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Disburse Confirm */}
      <Modal isOpen={disburseConfirm} onClose={() => setDisburseConfirm(false)} title="Confirm Loan Disbursement" size="sm">
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            Disbursing <strong>{formatCurrency(loan.approvedAmount)}</strong> to <strong>{loan.memberId?.fullName}</strong>. This will generate the full EMI schedule.
          </div>
          <div>
            <label className="form-label">Payment Method</label>
            <select value={disbursedMethod} onChange={e => setDisbursedMethod(e.target.value)} className="form-input">
              <option value="cash">Cash</option>
              <option value="online">Online Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDisburseConfirm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDisburse} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Disbursing...' : 'Confirm Disbursement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
