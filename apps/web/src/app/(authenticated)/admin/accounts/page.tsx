'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

export default function AdminAccountsPage() {
  const { user, token } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') return;
    apiFetch<any>('/api/accounts', { token })
      .then((res) => setAccounts(res.data || []))
      .finally(() => setLoading(false));
  }, [token, user?.role]);

  if (user?.role !== 'ADMIN') {
    return <div className="text-red-500 dark:text-red-400">Access denied</div>;
  }

  if (loading) return <div className="text-gray-500 dark:text-slate-400">Loading accounts...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Accounts</h1>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Account #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {accounts.map((acct) => (
              <tr key={acct.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 text-sm font-mono dark:text-slate-300">{acct.accountNumber}</td>
                <td className="px-6 py-4 text-sm dark:text-slate-300">{acct.firstName} {acct.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{acct.user?.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-700 dark:text-slate-300">
                    {acct.user?.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    acct.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                    acct.status === 'SUSPENDED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                    'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                  }`}>
                    {acct.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
