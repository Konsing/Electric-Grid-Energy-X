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

  if (loading) return <div className="text-zinc-500">Loading account...</div>;
  if (!account) return <div className="text-red-400">Account not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="font-bold tracking-tight text-zinc-50 mb-4">Profile</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-zinc-500">Name</dt>
              <dd className="text-sm font-medium text-zinc-200">{account.firstName} {account.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Account Number</dt>
              <dd className="text-sm font-medium font-mono text-zinc-300">{account.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Email</dt>
              <dd className="text-sm font-medium text-zinc-200">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Phone</dt>
              <dd className="text-sm font-medium text-zinc-200">{account.phone || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Service Address</dt>
              <dd className="text-sm font-medium text-zinc-200">{account.serviceAddress}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Status</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  account.status === 'ACTIVE' ? 'bg-green-950 text-green-400' :
                  account.status === 'SUSPENDED' ? 'bg-orange-950 text-orange-400' :
                  'bg-zinc-800 text-zinc-300'
                }`}>
                  {account.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="font-bold tracking-tight text-zinc-50 mb-4">Meters</h2>
          {account.meters && account.meters.length > 0 ? (
            <div className="space-y-3">
              {account.meters.map((meter: any) => (
                <div key={meter.id} className="p-3 bg-zinc-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium font-mono text-zinc-300">{meter.serialNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      meter.status === 'ACTIVE' ? 'bg-green-950 text-green-400' :
                      meter.status === 'MAINTENANCE' ? 'bg-yellow-950 text-yellow-400' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {meter.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{meter.model} — {meter.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No meters registered</p>
          )}
        </div>
      </div>
    </div>
  );
}
