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
    return <div className="text-red-400">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Manage Meters</h1>

      {/* Account Selection */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <h2 className="font-bold tracking-tight text-zinc-50 mb-4">Select Account</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-zinc-300 mb-1">Account</label>
            {accounts.length > 0 ? (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
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
                className="block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
              />
            )}
          </div>
          <button
            onClick={loadMeters}
            disabled={!accountId}
            className="px-4 py-2 bg-zinc-50 text-zinc-950 rounded-md hover:bg-zinc-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-4 py-2 bg-zinc-50 text-zinc-950 rounded-md hover:bg-zinc-200 text-sm font-semibold"
          >
            {showCreate ? 'Cancel' : 'Add Meter'}
          </button>
        </div>
      )}

      {/* Create Meter Form */}
      {showCreate && accountId && (
        <form onSubmit={handleCreate} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
          <h2 className="font-bold tracking-tight text-zinc-50">Create New Meter</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-300">Serial Number</label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-zinc-50 text-zinc-950 rounded-md hover:bg-zinc-200 text-sm font-semibold">
              Create Meter
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-800 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading && <div className="text-zinc-500">Loading meters...</div>}

      {/* Meters Table */}
      {!loading && meters.length > 0 && (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900">
              {meters.map((meter) => (
                <tr key={meter.id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-sm font-mono text-zinc-300">{meter.serialNumber}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{meter.model}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{meter.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      meter.status === 'ACTIVE' ? 'bg-green-950 text-green-400' :
                      meter.status === 'MAINTENANCE' ? 'bg-yellow-950 text-yellow-400' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {meter.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {meter.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(meter.id, 'ACTIVE')}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-green-950 text-green-400 hover:bg-green-900"
                        >
                          Activate
                        </button>
                      )}
                      {meter.status !== 'INACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(meter.id, 'INACTIVE')}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-red-950 text-red-400 hover:bg-red-900"
                        >
                          Deactivate
                        </button>
                      )}
                      {meter.status !== 'MAINTENANCE' && (
                        <button
                          onClick={() => handleStatusChange(meter.id, 'MAINTENANCE')}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-yellow-950 text-yellow-400 hover:bg-yellow-900"
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
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 text-center">
          <p className="text-zinc-500">No meters found for this account.</p>
        </div>
      )}
    </div>
  );
}
