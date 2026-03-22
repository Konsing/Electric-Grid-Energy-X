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
    return <div className="text-red-400">Access denied</div>;
  }

  if (loading) return <div className="text-zinc-500">Loading outages...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Manage Outages</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-zinc-50 text-zinc-950 rounded-md hover:bg-zinc-200 text-sm font-semibold"
        >
          Report Outage
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-300">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300">Affected Area</label>
              <input
                type="text"
                value={form.affectedArea}
                onChange={(e) => setForm({ ...form, affectedArea: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-300">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-zinc-50 text-zinc-950 rounded-md hover:bg-zinc-200 text-sm font-semibold">
              Create
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

      {(() => {
        const active = outages.filter((o) => o.status !== 'RESOLVED');
        const resolved = outages.filter((o) => o.status === 'RESOLVED');

        const renderCard = (outage: any) => (
          <div key={outage.id} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-zinc-50">{outage.title}</h3>
                <p className="text-sm text-zinc-400">{outage.affectedArea}</p>
                <p className="text-sm text-zinc-400 mt-2">{outage.description}</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  outage.severity === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                  outage.severity === 'HIGH' ? 'bg-orange-950 text-orange-400' :
                  outage.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-400' :
                  'bg-zinc-800 text-zinc-300'
                }`}>
                  {outage.severity}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  outage.status === 'RESOLVED' ? 'bg-green-950 text-green-400' :
                  outage.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-400' :
                  'bg-yellow-950 text-yellow-400'
                }`}>
                  {outage.status}
                </span>
                {outage.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(outage.id)}
                    className="px-3 py-1 text-xs bg-green-950 text-green-400 rounded-md hover:bg-green-900 font-medium"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        );

        return (
          <>
            <div className="space-y-4">
              {active.map(renderCard)}
              {active.length === 0 && (
                <div className="text-center py-8 text-zinc-500">No active outages</div>
              )}
            </div>

            {resolved.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-400 pt-4 border-t border-zinc-800">History</h2>
                {resolved.map(renderCard)}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
