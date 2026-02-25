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
    return <div className="text-red-500">Access denied</div>;
  }

  if (loading) return <div className="text-gray-500">Loading accounts...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Accounts</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {accounts.map((acct) => (
              <tr key={acct.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono">{acct.accountNumber}</td>
                <td className="px-6 py-4 text-sm">{acct.firstName} {acct.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{acct.user?.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                    {acct.user?.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    acct.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    acct.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
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
