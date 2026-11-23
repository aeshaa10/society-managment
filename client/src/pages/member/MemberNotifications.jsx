import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CheckCheck,
  CreditCard,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { notificationService } from '../../services/services';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MemberNotifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await notificationService.getAll({ limit: 50 });
      const data = res.data?.data;
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('Failed to mark notification as read');
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingAll(true);
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  function getNotificationIcon(type) {
    switch (type) {
      case 'loan_approved':
      case 'loan_disbursed':
        return <CheckCircle2 className="text-emerald-600" size={18} />;
      case 'loan_rejected':
      case 'installment_overdue':
        return <AlertTriangle className="text-red-500" size={18} />;
      case 'deposit_made':
        return <ArrowDownLeft className="text-emerald-600" size={18} />;
      case 'withdrawal_made':
        return <ArrowUpRight className="text-red-500" size={18} />;
      case 'loan_applied':
      case 'installment_due':
        return <CreditCard className="text-blue-600" size={18} />;
      default:
        return <Bell className="text-blue-800" size={18} />;
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with your loans, deposits, and society announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCheck size={15} />
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-blue-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'read'
              ? 'bg-blue-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center mx-auto mb-3">
            <Bell size={24} />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No notifications</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have caught up with all your notifications!'
              : 'You do not have any notifications in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
          {filteredNotifications.map((n) => {
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
                className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-colors cursor-pointer ${
                  n.isRead
                    ? 'hover:bg-gray-50/70 opacity-90'
                    : 'bg-blue-50/30 hover:bg-blue-50/60 border-l-4 border-l-blue-800'
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <p
                      className={`text-sm tracking-tight ${
                        n.isRead
                          ? 'font-medium text-gray-800'
                          : 'font-bold text-gray-900'
                      }`}
                    >
                      {n.title}
                    </p>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <Clock size={12} />
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n._id);
                    }}
                    title="Mark as read"
                    className="h-2 w-2 rounded-full bg-blue-700 mt-2 flex-shrink-0"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
