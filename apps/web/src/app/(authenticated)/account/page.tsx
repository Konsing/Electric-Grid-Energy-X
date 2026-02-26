'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAccount } from '@/lib/api';

export default function AccountPage() {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const accountId = user?.account?.id;

  useEffect(() => {
    if (!accountId || !token) return;
    getAccount(accountId, token)
      .then((res) => setAccount(res.data))
      .finally(() => setLoading(false));
  }, [accountId, token]);

  if (loading) return <div className="text-gray-500 dark:text-slate-400">Loading account...</div>;
  if (!account) return <div className="text-red-500 dark:text-red-400">Account not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Profile</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500 dark:text-slate-400">Name</dt>
              <dd className="text-sm font-medium dark:text-slate-200">{account.firstName} {account.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-slate-400">Account Number</dt>
              <dd className="text-sm font-medium font-mono dark:text-slate-200">{account.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-slate-400">Email</dt>
              <dd className="text-sm font-medium dark:text-slate-200">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-slate-400">Phone</dt>
              <dd className="text-sm font-medium dark:text-slate-200">{account.phone || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-slate-400">Service Address</dt>
              <dd className="text-sm font-medium dark:text-slate-200">{account.serviceAddress}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-slate-400">Status</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  account.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                  account.status === 'SUSPENDED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                  'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                }`}>
                  {account.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Meters</h2>
          {account.meters && account.meters.length > 0 ? (
            <div className="space-y-3">
              {account.meters.map((meter: any) => (
                <div key={meter.id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium font-mono dark:text-slate-200">{meter.serialNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      meter.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                      meter.status === 'MAINTENANCE' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                      'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                    }`}>
                      {meter.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{meter.model} — {meter.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">No meters registered</p>
          )}
        </div>
      </div>
    </div>
  );
}
