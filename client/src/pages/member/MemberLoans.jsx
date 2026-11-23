import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
  Percent,
  Clock,
} from 'lucide-react';
import { loanService, installmentService } from '../../services/services';
import { formatCurrency, formatDate, capitalize } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function MemberLoans() {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [instLoading, setInstLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  async function fetchLoans() {
    try {
      setLoading(true);
      setError(null);
      const res = await loanService.getMyLoans();
      setLoans(res.data?.data || []);
    } catch {
      setError('Failed to load your loans. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function openSchedule(loan) {
    setSelectedLoan(loan);
    setModalOpen(true);
    setInstLoading(true);
    try {
      const res = await installmentService.getByLoan(loan._id);
      setInstallments(res.data?.data || []);
    } catch {
      setInstallments([]);
    } finally {
      setInstLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedLoan(null);
    setInstallments([]);
  }

  const installmentColumns = [
    {
      key: 'installmentNumber',
      label: '#',
      render: (val) => <span className="text-sm font-medium text-gray-700">{val}</span>,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (val) => <span className="text-sm text-gray-600">{formatDate(val)}</span>,
    },
    {
      key: 'emiAmount',
      label: 'EMI',
      render: (val) => <span className="text-sm font-semibold text-gray-800">{formatCurrency(val)}</span>,
    },
    {
      key: 'principalComponent',
      label: 'Principal',
      render: (val) => <span className="text-sm text-gray-600">{formatCurrency(val)}</span>,
    },
    {
      key: 'interestComponent',
      label: 'Interest',
      render: (val) => <span className="text-sm text-blue-600">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'paidDate',
      label: 'Paid Date',
      render: (val) => <span className="text-sm text-gray-500">{val ? formatDate(val) : '—'}</span>,
    },
  ];

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
          <p className="text-sm text-gray-500 mt-1">View all your loan applications and repayment schedules.</p>
        </div>
        <Link
          to="/member/loans/apply"
          className="inline-flex items-center gap-2 bg-blue-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
        >
          <PlusCircle size={16} /> Apply for Loan
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
          <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No loans found.</p>
          <p className="text-gray-400 text-sm mt-1 mb-5">Start by applying for your first loan.</p>
          <Link
            to="/member/loans/apply"
            className="inline-flex items-center gap-2 bg-blue-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <PlusCircle size={15} /> Apply Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div
              key={loan._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={20} className="text-blue-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{capitalize(loan.loanType)} Loan</h3>
                        <Badge status={loan.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Applied: {formatDate(loan.appliedDate || loan.createdAt)}
                      </p>
                      {loan.purpose && (
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">Purpose: {loan.purpose}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Info */}
                  <div className="flex flex-wrap gap-4 sm:gap-6 sm:text-right">
                    <div>
                      <p className="text-xs text-gray-400">Requested</p>
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(loan.requestedAmount)}</p>
                    </div>
                    {loan.approvedAmount && (
                      <div>
                        <p className="text-xs text-gray-400">Approved</p>
                        <p className="text-sm font-semibold text-emerald-600">{formatCurrency(loan.approvedAmount)}</p>
                      </div>
                    )}
                    {loan.outstandingBalance !== undefined && (
                      <div>
                        <p className="text-xs text-gray-400">Outstanding</p>
                        <p className="text-sm font-semibold text-blue-700">{formatCurrency(loan.outstandingBalance)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan Meta */}
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Percent size={12} className="text-gray-400" />
                    Interest: <span className="font-semibold text-gray-700">{loan.interestRate ?? '—'}% p.a.</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={12} className="text-gray-400" />
                    Tenure: <span className="font-semibold text-gray-700">{loan.tenureMonths ?? '—'} months</span>
                  </div>
                  {loan.emiAmount && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <CreditCard size={12} className="text-gray-400" />
                      EMI: <span className="font-semibold text-gray-700">{formatCurrency(loan.emiAmount)}/mo</span>
                    </div>
                  )}
                  {loan.disbursementDate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} className="text-gray-400" />
                      Disbursed: <span className="font-semibold text-gray-700">{formatDate(loan.disbursementDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              {(loan.status === 'disbursed' || loan.status === 'closed') && (
                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                  <button
                    onClick={() => openSchedule(loan)}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:text-blue-800 transition-colors"
                  >
                    View Installment Schedule <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Installment Schedule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={`Installment Schedule — ${selectedLoan ? capitalize(selectedLoan.loanType) + ' Loan' : ''}`}
        size="xl"
      >
        {instLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {selectedLoan && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500">Approved Amount</p>
                  <p className="text-sm font-bold text-blue-800">{formatCurrency(selectedLoan.approvedAmount)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500">Monthly EMI</p>
                  <p className="text-sm font-bold text-emerald-700">{formatCurrency(selectedLoan.emiAmount)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500">Interest Rate</p>
                  <p className="text-sm font-bold text-purple-700">{selectedLoan.interestRate}% p.a.</p>
                </div>
                <div className="bg-amber-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500">Tenure</p>
                  <p className="text-sm font-bold text-amber-700">{selectedLoan.tenureMonths} months</p>
                </div>
              </div>
            )}

            {/* Installments table with overdue highlighting */}
            {installments.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No installment records found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['#', 'Due Date', 'EMI', 'Principal', 'Interest', 'Status', 'Paid Date'].map((h) => (
                        <th key={h} className="table-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {installments.map((inst) => {
                      const isOverdue = inst.status === 'overdue';
                      return (
                        <tr
                          key={inst._id}
                          className={`transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-gray-50/60'}`}
                        >
                          <td className={`table-td font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                            {inst.installmentNumber}
                          </td>
                          <td className={`table-td ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {formatDate(inst.dueDate)}
                          </td>
                          <td className="table-td font-semibold text-gray-800">{formatCurrency(inst.emiAmount)}</td>
                          <td className="table-td text-gray-600">{formatCurrency(inst.principalComponent)}</td>
                          <td className="table-td text-blue-600">{formatCurrency(inst.interestComponent)}</td>
                          <td className="table-td">
                            <Badge status={inst.status} />
                          </td>
                          <td className="table-td text-gray-500">{inst.paidDate ? formatDate(inst.paidDate) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
