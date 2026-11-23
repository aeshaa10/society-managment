import { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/services';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function getNotifIcon(type) {
  const map = {
    info: <Info size={18} className="text-blue-500" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    success: <CheckCircle size={18} className="text-emerald-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    loan: <Bell size={18} className="text-purple-500" />,
  };
  return map[type] || <Bell size={18} className="text-blue-500" />;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await notificationService.getAll();
      const data = res.data?.notifications || res.data?.data || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notif) {
    if (notif.read || notif.isRead) return;
    try {
      await notificationService.markRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notif._id ? { ...n, read: true, isRead: true } : n
        )
      );
    } catch {
      toast.error('Could not mark as read');
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingAll(true);
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? (
              <span className="text-blue-600 font-medium">{unreadCount} unread</span>
            ) : (
              'All caught up!'
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckCheck size={16} />
            {markingAll ? 'Marking...' : 'Mark All Read'}
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
          <div className="p-5 rounded-full bg-gray-100">
            <BellOff size={36} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-gray-400 text-sm">You're all caught up. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const isUnread = !notif.read && !notif.isRead;
            return (
              <div
                key={notif._id}
                onClick={() => handleMarkRead(notif)}
                className={`group flex gap-4 p-4 rounded-xl border transition-all cursor-pointer
                  ${
                    isUnread
                      ? 'bg-blue-50/60 border-blue-100 hover:bg-blue-50 shadow-sm'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 p-2.5 rounded-full ${
                    isUnread ? 'bg-white shadow-sm' : 'bg-gray-100'
                  }`}
                >
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm leading-snug ${
                        isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                      }`}
                    >
                      {notif.title || 'Notification'}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                        <Clock size={11} />
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                  {notif.message && (
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                  )}
                  {notif.link && (
                    <a
                      href={notif.link}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View Details →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      {notifications.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
