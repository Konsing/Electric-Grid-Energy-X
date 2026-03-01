'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listAccounts, updateAccountStatus, deleteAccount } from '@/lib/api';

export default function AdminAccountsPage() {
  const { user, token } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token || user?.role !== 'ADMIN') return;
    const res = await listAccounts(token);
    setAccounts(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token, user?.role]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!token) return;
    await updateAccountStatus(id, status, token);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this account?')) return;
    await deleteAccount(id, token);
    load();
  };

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
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
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {acct.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(acct.id, 'SUSPENDED')}
                        className="px-3 py-1 text-xs font-medium rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                      >
                        Suspend
                      </button>
                    )}
                    {acct.status === 'SUSPENDED' && (
                      <button
                        onClick={() => handleStatusChange(acct.id, 'ACTIVE')}
                        className="px-3 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(acct.id)}
                      className="px-3 py-1 text-xs font-medium rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
