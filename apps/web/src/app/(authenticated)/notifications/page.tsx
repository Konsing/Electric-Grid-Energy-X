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

  if (loading) return <div className="text-zinc-500">Loading notifications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-zinc-400">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 text-sm border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-800"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`bg-zinc-900 p-4 rounded-lg border border-zinc-800 ${
              !notif.readAt ? 'border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
                    {notif.type}
                  </span>
                  <h3 className="text-sm font-medium text-zinc-200">{notif.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 mt-1">{notif.message}</p>
                <p className="text-xs text-zinc-500 mt-2">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.readAt && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="text-xs border border-zinc-700 text-zinc-300 px-2 py-1 rounded-md hover:bg-zinc-800"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-8 text-zinc-500">No notifications</div>
        )}
      </div>
    </div>
  );
}
