import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, RoleRoute } from './routes/ProtectedRoutes';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import MembersPage from './pages/admin/MembersPage';
import AddMemberPage from './pages/admin/AddMemberPage';
import MemberDetailPage from './pages/admin/MemberDetailPage';
import SavingsPage from './pages/admin/SavingsPage';
import AccountDetailPage from './pages/admin/AccountDetailPage';
import LoansPage from './pages/admin/LoansPage';
import LoanDetailPage from './pages/admin/LoanDetailPage';
import RepaymentsPage from './pages/admin/RepaymentsPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import ReportsPage from './pages/admin/ReportsPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SettingsPage from './pages/admin/SettingsPage';
import EMICalculatorPage from './pages/admin/EMICalculatorPage';

// Member pages
import MemberDashboard from './pages/member/MemberDashboard';
import MemberSavings from './pages/member/MemberSavings';
import MemberLoans from './pages/member/MemberLoans';
import ApplyLoanPage from './pages/member/ApplyLoanPage';
import MemberTransactions from './pages/member/MemberTransactions';
import MemberNotifications from './pages/member/MemberNotifications';
import MemberProfile from './pages/member/MemberProfile';

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-2">403</h1>
        <p className="text-gray-600">You are not authorized to view this page.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontSize: '14px' },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Admin & Staff routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<RoleRoute roles={['admin', 'staff']} />}>
              <Route element={<Layout />}>
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/members" element={<MembersPage />} />
                <Route path="/admin/members/add" element={<AddMemberPage />} />
                <Route path="/admin/members/:id" element={<MemberDetailPage />} />
                <Route path="/admin/savings" element={<SavingsPage />} />
                <Route path="/admin/savings/:id" element={<AccountDetailPage />} />
                <Route path="/admin/loans" element={<LoansPage />} />
                <Route path="/admin/loans/:id" element={<LoanDetailPage />} />
                <Route path="/admin/repayments" element={<RepaymentsPage />} />
                <Route path="/admin/transactions" element={<TransactionsPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
                <Route path="/admin/emi-calculator" element={<EMICalculatorPage />} />

                {/* Admin-only */}
                <Route element={<RoleRoute roles={['admin']} />}>
                  <Route path="/admin/staff" element={<StaffManagementPage />} />
                  <Route path="/admin/audit" element={<AuditLogsPage />} />
                  <Route path="/admin/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Member routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<RoleRoute roles={['member']} />}>
              <Route element={<Layout />}>
                <Route path="/member/dashboard" element={<MemberDashboard />} />
                <Route path="/member/savings" element={<MemberSavings />} />
                <Route path="/member/loans" element={<MemberLoans />} />
                <Route path="/member/loans/apply" element={<ApplyLoanPage />} />
                <Route path="/member/transactions" element={<MemberTransactions />} />
                <Route path="/member/notifications" element={<MemberNotifications />} />
                <Route path="/member/profile" element={<MemberProfile />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
