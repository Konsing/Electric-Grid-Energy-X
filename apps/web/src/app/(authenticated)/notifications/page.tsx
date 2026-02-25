'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api';

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const accountId = user?.account?.id;

  const loadNotifications = async () => {
    if (!accountId || !token) return;
    try {
      const res = await getNotifications(accountId, token);
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [accountId, token]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    await markNotificationRead(id, token);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!accountId || !token) return;
    await markAllNotificationsRead(accountId, token);
    loadNotifications();
  };

  if (loading) return <div className="text-gray-500">Loading notifications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`bg-white p-4 rounded-xl shadow-sm border ${
              !notif.readAt ? 'border-l-4 border-l-brand-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {notif.type}
                  </span>
                  <h3 className="text-sm font-medium">{notif.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.readAt && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-8 text-gray-500">No notifications</div>
        )}
      </div>
    </div>
  );
}
