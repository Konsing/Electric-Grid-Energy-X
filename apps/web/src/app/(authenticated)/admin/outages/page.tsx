'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getOutages, createOutage, resolveOutage } from '@/lib/api';

export default function AdminOutagesPage() {
  const { user, token } = useAuth();
  const [outages, setOutages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    affectedArea: '',
    severity: 'MEDIUM',
  });

  const loadOutages = async () => {
    if (!token) return;
    const res = await getOutages(token);
    setOutages(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOutages();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    await createOutage(form, token);
    setShowCreate(false);
    setForm({ title: '', description: '', affectedArea: '', severity: 'MEDIUM' });
    loadOutages();
  };

  const handleResolve = async (id: string) => {
    if (!token) return;
    await resolveOutage(id, token);
    loadOutages();
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN') {
    return <div className="text-red-500 dark:text-red-400">Access denied</div>;
  }

  if (loading) return <div className="text-gray-500 dark:text-slate-400">Loading outages...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Outages</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm"
        >
          Report Outage
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Affected Area</label>
              <input
                type="text"
                value={form.affectedArea}
                onChange={(e) => setForm({ ...form, affectedArea: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm">
              Create
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

      <div className="space-y-4">
        {outages.map((outage) => (
          <div key={outage.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold dark:text-white">{outage.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{outage.affectedArea}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">{outage.description}</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  outage.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                  outage.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                }`}>
                  {outage.severity}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  outage.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                }`}>
                  {outage.status}
                </span>
                {outage.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(outage.id)}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
