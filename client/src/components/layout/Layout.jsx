import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// Map route paths to page titles
const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/members': 'Member Management',
  '/admin/members/add': 'Add Member',
  '/admin/savings': 'Savings & Deposits',
  '/admin/loans': 'Loan Management',
  '/admin/repayments': 'Repayments',
  '/admin/transactions': 'Transactions',
  '/admin/reports': 'Reports & Analytics',
  '/admin/notifications': 'Notifications',
  '/admin/staff': 'Staff Management',
  '/admin/audit': 'Audit Logs',
  '/admin/settings': 'Settings',
  '/admin/emi-calculator': 'EMI Calculator',
  '/member/dashboard': 'My Dashboard',
  '/member/savings': 'My Savings',
  '/member/loans': 'My Loans',
  '/member/transactions': 'My Transactions',
  '/member/notifications': 'Notifications',
  '/member/profile': 'My Profile',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const title = pageTitles[pathname] || 'CSMS';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} pageTitle={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
