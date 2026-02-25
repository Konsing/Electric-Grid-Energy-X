'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getOutages, apiFetch } from '@/lib/api';

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
    await apiFetch('/api/outages', {
      method: 'POST',
      body: JSON.stringify(form),
      token,
    });
    setShowCreate(false);
    setForm({ title: '', description: '', affectedArea: '', severity: 'MEDIUM' });
    loadOutages();
  };

  const handleResolve = async (id: string) => {
    if (!token) return;
    await apiFetch(`/api/outages/${id}/resolve`, { method: 'POST', token });
    loadOutages();
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'TECHNICIAN') {
    return <div className="text-red-500">Access denied</div>;
  }

  if (loading) return <div className="text-gray-500">Loading outages...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Outages</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm"
        >
          Report Outage
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Affected Area</label>
              <input
                type="text"
                value={form.affectedArea}
                onChange={(e) => setForm({ ...form, affectedArea: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {outages.map((outage) => (
          <div key={outage.id} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{outage.title}</h3>
                <p className="text-sm text-gray-500">{outage.affectedArea}</p>
                <p className="text-sm text-gray-600 mt-2">{outage.description}</p>
              </div>
              <div className="flex gap-2 items-start">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  outage.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  outage.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {outage.severity}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  outage.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
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
