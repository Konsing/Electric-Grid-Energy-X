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

  if (loading) return <div className="text-gray-500">Loading account...</div>;
  if (!account) return <div className="text-red-500">Account not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-sm font-medium">{account.firstName} {account.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Account Number</dt>
              <dd className="text-sm font-medium font-mono">{account.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-sm font-medium">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="text-sm font-medium">{account.phone || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Service Address</dt>
              <dd className="text-sm font-medium">{account.serviceAddress}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  account.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  account.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {account.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Meters</h2>
          {account.meters && account.meters.length > 0 ? (
            <div className="space-y-3">
              {account.meters.map((meter: any) => (
                <div key={meter.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium font-mono">{meter.serialNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      meter.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      meter.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {meter.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{meter.model} — {meter.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No meters registered</p>
          )}
        </div>
      </div>
    </div>
  );
}
