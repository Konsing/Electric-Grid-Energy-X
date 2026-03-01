'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listAccounts, getAccountMeters, createMeter, updateMeter } from '@/lib/api';

export default function AdminMetersPage() {
  const { user, token } = useAuth();
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [meters, setMeters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    serialNumber: '',
    model: '',
    location: '',
  });

  useEffect(() => {
    if (!token || (user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN')) return;
    listAccounts(token).then((res) => setAccounts(res.data || []));
  }, [token, user?.role]);

  const loadMeters = async () => {
    if (!token || !accountId) return;
    setLoading(true);
    try {
      const res = await getAccountMeters(accountId, token);
      setMeters(res.data || []);
    } catch {
      setMeters([]);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !accountId) return;
    await createMeter(accountId, form, token);
    setForm({ serialNumber: '', model: '', location: '' });
    setShowCreate(false);
    loadMeters();
  };

  const handleStatusChange = async (meterId: string, status: string) => {
    if (!token) return;
    await updateMeter(meterId, { status }, token);
    loadMeters();
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN') {
    return <div className="text-red-500 dark:text-red-400">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Meters</h1>

      {/* Account Selection */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Account</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Account</label>
            {accounts.length > 0 ? (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              >
                <option value="">-- Select an account --</option>
                {accounts.map((acct) => (
                  <option key={acct.id} value={acct.id}>
                    {acct.accountNumber} - {acct.firstName} {acct.lastName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Enter account ID"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            )}
          </div>
          <button
            onClick={loadMeters}
            disabled={!accountId}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load Meters
          </button>
        </div>
      </div>

      {/* Create Meter Toggle */}
      {accountId && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm"
          >
            {showCreate ? 'Cancel' : 'Add Meter'}
          </button>
        </div>
      )}

      {/* Create Meter Form */}
      {showCreate && accountId && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Meter</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Serial Number</label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">
              Create Meter
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading && <div className="text-gray-500 dark:text-slate-400">Loading meters...</div>}

      {/* Meters Table */}
      {!loading && meters.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {meters.map((meter) => (
                <tr key={meter.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-sm font-mono dark:text-slate-300">{meter.serialNumber}</td>
                  <td className="px-6 py-4 text-sm dark:text-slate-300">{meter.model}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{meter.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      meter.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                      meter.status === 'MAINTENANCE' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                      'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                    }`}>
                      {meter.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {meter.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(meter.id, 'ACTIVE')}
                          className="px-3 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          Activate
                        </button>
                      )}
                      {meter.status !== 'INACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(meter.id, 'INACTIVE')}
                          className="px-3 py-1 text-xs font-medium rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          Deactivate
                        </button>
                      )}
                      {meter.status !== 'MAINTENANCE' && (
                        <button
                          onClick={() => handleStatusChange(meter.id, 'MAINTENANCE')}
                          className="px-3 py-1 text-xs font-medium rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                        >
                          Maintenance
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && accountId && meters.length === 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700 text-center">
          <p className="text-gray-500 dark:text-slate-400">No meters found for this account.</p>
        </div>
      )}
    </div>
  );
}
