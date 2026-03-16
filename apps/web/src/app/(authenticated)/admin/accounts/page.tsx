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
    return <div className="text-red-400">Access denied</div>;
  }

  if (loading) return <div className="text-zinc-500">Loading accounts...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Manage Accounts</h1>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Account #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900">
            {accounts.map((acct) => (
              <tr key={acct.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4 text-sm font-mono text-zinc-300">{acct.accountNumber}</td>
                <td className="px-6 py-4 text-sm text-zinc-300">{acct.firstName} {acct.lastName}</td>
                <td className="px-6 py-4 text-sm text-zinc-400">{acct.user?.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200">
                    {acct.user?.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    acct.status === 'ACTIVE' ? 'bg-green-950 text-green-400' :
                    acct.status === 'SUSPENDED' ? 'bg-orange-950 text-orange-400' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {acct.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {acct.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(acct.id, 'SUSPENDED')}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-orange-950 text-orange-400 hover:bg-orange-900"
                      >
                        Suspend
                      </button>
                    )}
                    {acct.status === 'SUSPENDED' && (
                      <button
                        onClick={() => handleStatusChange(acct.id, 'ACTIVE')}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-green-950 text-green-400 hover:bg-green-900"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(acct.id)}
                      className="px-3 py-1 text-xs font-medium rounded-md bg-red-950 text-red-400 hover:bg-red-900"
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
