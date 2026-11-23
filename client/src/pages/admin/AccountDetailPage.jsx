import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { savingsService } from '../../services/services';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ChevronLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function AccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [statement, setStatement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null); // 'deposit' | 'withdraw'
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAccount = () => {
    return Promise.all([
      savingsService.getById(id),
      savingsService.getStatement(id),
    ]).then(([accRes, stmtRes]) => {
      setAccount(accRes.data.data?.account || accRes.data.data);
      setStatement(stmtRes.data.data?.transactions || stmtRes.data.data || []);
    });
  };

  useEffect(() => {
    fetchAccount().catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleTransaction = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { amount: Number(amount), paymentMethod: method, description };
      if (modalType === 'deposit') {
        await savingsService.deposit(id, payload);
        toast.success('Deposit recorded successfully');
      } else {
        await savingsService.withdraw(id, payload);
        toast.success('Withdrawal recorded successfully');
      }
      setModalType(null);
      setAmount('');
      setDescription('');
      await fetchAccount();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!account) return <div className="text-center py-16 text-gray-400">Account not found</div>;

  const member = account.memberId;

  const txnColumns = [
    { key: 'createdAt', label: 'Date', render: v => formatDate(v) },
    { key: 'transactionId', label: 'Txn ID', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'type', label: 'Type', render: v => <Badge status={v} /> },
    { key: 'amount', label: 'Amount', render: (v, row) => (
      <span className={`font-semibold ${row.type === 'deposit' ? 'text-emerald-600' : 'text-red-500'}`}>
        {row.type === 'deposit' ? '+' : '-'}{formatCurrency(v)}
      </span>
    )},
    { key: 'balanceAfter', label: 'Balance After', render: v => <span className="font-medium">{formatCurrency(v)}</span> },
    { key: 'paymentMethod', label: 'Method', render: v => <span className="capitalize">{v || '—'}</span> },
    { key: 'description', label: 'Note', render: v => v || '—' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Account {account.accountNumber}</h2>
          <p className="text-sm text-gray-500">{member?.fullName} • {member?.memberId}</p>
        </div>
      </div>

      {/* Account summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 col-span-1 md:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(account.balance)}</p>
            <p className="text-xs text-gray-400 mt-1">Min balance: {formatCurrency(account.minimumBalance)}</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge status={account.status} />
            <span className="text-xs text-gray-400">Opened {formatDate(account.openedDate)}</span>
          </div>
        </div>

        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingUp size={18} />
            <p className="text-sm font-semibold">Deposit</p>
          </div>
          <p className="text-xs text-gray-500">Record a cash or online deposit to this account</p>
          <button onClick={() => setModalType('deposit')} className="btn-success mt-auto text-sm">
            + Deposit
          </button>
        </div>

        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red-600">
            <TrendingDown size={18} />
            <p className="text-sm font-semibold">Withdrawal</p>
          </div>
          <p className="text-xs text-gray-500">Record a withdrawal. Balance validation is enforced.</p>
          <button onClick={() => setModalType('withdraw')} className="btn-danger mt-auto text-sm">
            - Withdraw
          </button>
        </div>
      </div>

      {/* Statement */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction History</h3>
        <DataTable columns={txnColumns} data={statement} emptyMessage="No transactions yet" />
      </div>

      {/* Deposit/Withdraw Modal */}
      <Modal
        isOpen={!!modalType}
        onClose={() => { setModalType(null); setAmount(''); setDescription(''); }}
        title={modalType === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="form-input"
              placeholder="10000"
              min={1}
            />
          </div>
          <div>
            <label className="form-label">Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="form-input">
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="form-label">Description / Note</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="form-input"
              placeholder="Monthly savings, etc."
            />
          </div>
          {modalType === 'withdraw' && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Available to withdraw: {formatCurrency(Math.max(0, account.balance - account.minimumBalance))}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setModalType(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleTransaction}
              disabled={submitting}
              className={`flex-1 ${modalType === 'deposit' ? 'btn-success' : 'btn-danger'}`}
            >
              {submitting ? 'Processing...' : modalType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
