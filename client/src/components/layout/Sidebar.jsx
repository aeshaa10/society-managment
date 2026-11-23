import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, PiggyBank, CreditCard, RefreshCcw,
  ArrowLeftRight, BarChart3, Bell, Shield, Settings,
  UserCog, Building2, ChevronRight, X
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Members', icon: Users, to: '/admin/members' },
  { label: 'Savings & Deposits', icon: PiggyBank, to: '/admin/savings' },
  { label: 'Loans', icon: CreditCard, to: '/admin/loans' },
  { label: 'Repayments', icon: RefreshCcw, to: '/admin/repayments' },
  { label: 'Transactions', icon: ArrowLeftRight, to: '/admin/transactions' },
  { label: 'Reports', icon: BarChart3, to: '/admin/reports' },
  { label: 'Notifications', icon: Bell, to: '/admin/notifications' },
  { label: 'Staff Management', icon: UserCog, to: '/admin/staff' },
  { label: 'Audit Logs', icon: Shield, to: '/admin/audit' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
];

const staffNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Members', icon: Users, to: '/admin/members' },
  { label: 'Savings & Deposits', icon: PiggyBank, to: '/admin/savings' },
  { label: 'Loans', icon: CreditCard, to: '/admin/loans' },
  { label: 'Repayments', icon: RefreshCcw, to: '/admin/repayments' },
  { label: 'Transactions', icon: ArrowLeftRight, to: '/admin/transactions' },
  { label: 'Reports', icon: BarChart3, to: '/admin/reports' },
  { label: 'Notifications', icon: Bell, to: '/admin/notifications' },
];

const memberNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/member/dashboard' },
  { label: 'My Savings', icon: PiggyBank, to: '/member/savings' },
  { label: 'My Loans', icon: CreditCard, to: '/member/loans' },
  { label: 'Transactions', icon: ArrowLeftRight, to: '/member/transactions' },
  { label: 'Notifications', icon: Bell, to: '/member/notifications' },
  { label: 'My Profile', icon: Users, to: '/member/profile' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const navItems =
    user?.role === 'admin' ? adminNav :
    user?.role === 'staff' ? staffNav :
    memberNav;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-blue-950 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-700 rounded-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Sahyog Society</p>
              <p className="text-xs text-blue-300">Co-operative Credit</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-blue-900">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors group
                ${isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-900">
          <p className="text-xs text-blue-400 text-center">CSMS v1.0 • Academic Project</p>
        </div>
      </aside>
    </>
  );
}
