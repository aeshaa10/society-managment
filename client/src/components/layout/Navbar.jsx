import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, LogOut, User, ChevronDown, Calculator } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { notificationService } from '../../services/services';

export default function Navbar({ onMenuClick, pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    notificationService.getUnreadCount().then(({ data }) => {
      if (data.success) setUnreadCount(data.data.count);
    }).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifPath = user?.role === 'member' ? '/member/notifications' : '/admin/notifications';
  const profilePath = user?.role === 'member' ? '/member/profile' : '/admin/profile';
  const emiPath = '/admin/emi-calculator';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
      {/* Left: menu + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block">{pageTitle}</h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* EMI Calculator quick link (admin/staff) */}
        {user?.role !== 'member' && (
          <Link
            to={emiPath}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="EMI Calculator"
          >
            <Calculator size={20} />
          </Link>
        )}

        {/* Notifications */}
        <Link
          to={notifPath}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 bg-blue-900 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-24 truncate">
              {user?.name}
            </span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Link
                to={profilePath}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={15} />
                My Profile
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
